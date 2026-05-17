import type { NextRequest } from 'next/server';
import { createClient } from '../../lib/supabase/server';
import { logger } from '../../lib/logger';
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
    const supabase = await createClient();
    const resolvedUser = await resolveAuthenticatedUserId({
      request,
      supabase,
      pathname,
      clientIp,
    });

    if (!resolvedUser.userId) {
      if (!resolvedUser.error) {
        await logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', {
          path: pathname,
          ip: clientIp,
          userAgent,
        });
      }
      return { isValid: false, error: resolvedUser.error || 'No session found' };
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
