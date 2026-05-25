import { logSecurityEvent } from './auth.logging'
import type { AuthUserRow, ValidRole, ValidationResult } from './auth.types'

export async function buildInsufficientPermissionsResult(params: {
  authUser: AuthUserRow
  role: ValidRole
  pathname: string
  clientIp: string
}): Promise<ValidationResult> {
  await logSecurityEvent('INSUFFICIENT_PERMISSIONS', {
    userId: params.authUser.id,
    role: params.role,
    attemptedPath: params.pathname,
    ip: params.clientIp,
  })

  return {
    isValid: false,
    userId: params.authUser.id,
    role: params.role,
    error: 'Insufficient permissions',
  }
}

export async function buildSuccessfulValidationResult(
  authUser: AuthUserRow,
  role: ValidRole,
  pathname: string,
): Promise<ValidationResult> {
  await logSecurityEvent('ROLE_VALIDATION_SUCCESS', {
    userId: authUser.id,
    role,
    path: pathname,
  })

  return {
    isValid: true,
    userId: authUser.id,
    role,
  }
}
