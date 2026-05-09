const INVITATION_ERROR_KEY_BY_REASON: Record<string, string> = {
  expired: 'auth.invitation.errors.expired',
  exhausted: 'auth.invitation.errors.exhausted',
  inactive: 'auth.invitation.errors.inactive',
  not_found: 'auth.invitation.errors.notFound',
  paused: 'auth.invitation.errors.paused',
  revoked: 'auth.invitation.errors.revoked',
  used: 'auth.invitation.errors.used',
}

const LEGACY_ERROR_PATTERNS: Array<[RegExp, string]> = [
  [/utilizada|accepted/, 'auth.invitation.errors.used'],
  [/revocada|revoked/, 'auth.invitation.errors.revoked'],
  [/expirad|expiro|expired/, 'auth.invitation.errors.expired'],
  [/limite|registros|exhausted/, 'auth.invitation.errors.exhausted'],
  [/pausad|paused/, 'auth.invitation.errors.paused'],
  [/no esta activo|not active|inactive/, 'auth.invitation.errors.inactive'],
  [/no encontrad|not found/, 'auth.invitation.errors.notFound'],
  [/token.*invalid|invalid.*token|token invalido/, 'auth.invitation.errors.invalidToken'],
  [/no es para esta organizacion/, 'auth.invitation.errors.wrongOrganization'],
  [/correo no ha sido invitado|email has not been invited/, 'auth.invitation.errors.emailNotInvited'],
  [/no autenticado|not authenticated/, 'auth.invitation.errors.unauthenticated'],
  [/no autorizado|not authorized/, 'auth.invitation.errors.unauthorized'],
  [/conexion|connection/, 'auth.invitation.errors.connection'],
]

const ROLE_TRANSLATION_KEYS: Record<string, string> = {
  admin: 'auth.roles.admin',
  member: 'auth.roles.member',
  owner: 'auth.roles.owner',
}

export function getInvitationErrorTranslationKey(params: {
  error?: string | null
  reason?: string | null
}): string {
  const reasonKey = params.reason
    ? INVITATION_ERROR_KEY_BY_REASON[params.reason]
    : undefined

  if (reasonKey) {
    return reasonKey
  }

  const normalizedError = normalizeLegacyInvitationError(params.error)
  const legacyMatch = LEGACY_ERROR_PATTERNS.find(([pattern]) =>
    pattern.test(normalizedError),
  )

  return legacyMatch?.[1] ?? 'auth.invitation.errors.invalid'
}

export function getInvitationRoleTranslationKey(role?: string | null): string {
  if (!role) {
    return ROLE_TRANSLATION_KEYS.member
  }

  return ROLE_TRANSLATION_KEYS[role] ?? role
}

function normalizeLegacyInvitationError(error?: string | null): string {
  return (error ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}
