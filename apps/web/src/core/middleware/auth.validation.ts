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
): Promise<ValidationResult> {
  const pathname = request.nextUrl.pathname;
  const clientIp = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    const supabase = createRequestSupabaseClient(request);
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

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, cargo_rol, email, username')
      .eq('id', resolvedUser.userId)
      .single();

    if (userError || !userData) {
      await logSecurityEvent('USER_NOT_FOUND', { userId: resolvedUser.userId, path: pathname });
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
  const normalizedRole = normalizeRole(params.authUser.cargo_rol);

  if (!normalizedRole) {
    await logSecurityEvent('INVALID_ROLE', {
      userId: params.authUser.id,
      role: params.authUser.cargo_rol ?? undefined,
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
