import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { logger } from '../../lib/logger';
import type { Database } from '../../lib/supabase/types';
import { getClientIp, logSecurityEvent } from './auth.logging';
import { hasRoleAccess, normalizeRole } from './auth.roles';
import { resolveAuthenticatedUserId } from './auth.session';
import {
  buildInsufficientPermissionsResult,
  buildSuccessfulValidationResult,
} from './auth.validation-access';
import type { AuthUserRow, ValidRole, ValidationResult } from './auth.types';

export async function validateRoleAccess(
  request: NextRequest,
  requiredRole?: ValidRole,
  preResolvedUserId?: string | null,
): Promise<ValidationResult> {
  const pathname = request.nextUrl.pathname;
  const clientIp = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    const supabase = createRequestSupabaseClient(request);

    // Si el middleware ya valido la sesion nativa (auth.getUser una sola vez),
    // reutilizamos ese userId y evitamos un segundo round trip al Auth server.
    // Cuando no viene pre-resuelto (p. ej. sesiones legacy), resolvemos como antes
    // para preservar el fallback de cookie/refresh-token y su logging de seguridad.
    let userId = preResolvedUserId ?? null;

    if (!userId) {
      const resolvedUser = await resolveAuthenticatedUserId({
        request,
        supabase,
        pathname,
        clientIp,
      });

      if (!resolvedUser.userId) {
        const resolvedUserError = 'error' in resolvedUser ? resolvedUser.error : undefined;

        if (!resolvedUserError) {
          await logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', {
            path: pathname,
            ip: clientIp,
            userAgent,
          });
        }
        return { isValid: false, error: resolvedUserError || 'No session found' };
      }

      userId = resolvedUser.userId;
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, platform_role, email, username')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      await logSecurityEvent('USER_NOT_FOUND', { userId, path: pathname });
      return { isValid: false, error: 'User not found' };
    }

    return validateResolvedUserAccess({
      authUser: userData as AuthUserRow,
      pathname,
      requiredRole,
      clientIp,
    });
  } catch (error) {
    logger.error('Error in role validation', error);
    return { isValid: false, error: 'Validation error' };
  }
}

function createRequestSupabaseClient(request: NextRequest) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // Session refresh is handled by the top-level Supabase middleware.
        },
      },
    },
  );
}

async function validateResolvedUserAccess(params: {
  authUser: AuthUserRow
  pathname: string
  requiredRole?: ValidRole
  clientIp: string
}): Promise<ValidationResult> {
  const normalizedRole = normalizeRole(params.authUser.platform_role);

  if (!normalizedRole) {
    await logSecurityEvent('INVALID_ROLE', {
      userId: params.authUser.id,
      role: params.authUser.platform_role ?? undefined,
      path: params.pathname,
    });
    return { isValid: false, error: 'Invalid role' };
  }

  if (
    (params.requiredRole && normalizedRole !== params.requiredRole) ||
    !hasRoleAccess(normalizedRole, params.pathname)
  ) {
    return buildInsufficientPermissionsResult({
      authUser: params.authUser,
      role: normalizedRole,
      pathname: params.pathname,
      clientIp: params.clientIp,
    });
  }

  return buildSuccessfulValidationResult(
    params.authUser,
    normalizedRole,
    params.pathname,
  );
}
