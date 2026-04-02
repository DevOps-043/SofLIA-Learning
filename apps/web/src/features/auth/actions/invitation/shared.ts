import type { InvitationRole } from './schemas'
import type {
  BulkInviteLinkRecord,
  UserInvitationMetadata,
} from './types'

const INVITATION_EXPIRY_DAYS = 7
const INVITATION_TOKEN_LENGTH = 64

export function buildInvitationExpiry(baseDate: Date) {
  return new Date(
    baseDate.getTime() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  ).toISOString()
}

export function getInvitationPosition(metadata?: UserInvitationMetadata | null) {
  return metadata?.position ?? undefined
}

export function isExpired(isoDate: string, now: Date) {
  return new Date(isoDate) < now
}

export function isInvitationToken(value: string) {
  return (
    value.length === INVITATION_TOKEN_LENGTH &&
    /^[a-f0-9]+$/i.test(value)
  )
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function resolveInvitationRole(
  role: string | null | undefined
): InvitationRole {
  if (role === 'owner' || role === 'admin' || role === 'member') {
    return role
  }

  return 'member'
}

export function getBulkInviteStateCheck(
  link: BulkInviteLinkRecord,
  now: Date = new Date()
) {
  if (link.status !== 'active') {
    switch (link.status) {
      case 'expired':
        return { valid: false as const, error: 'Este enlace de invitacion ha expirado' }
      case 'exhausted':
        return {
          valid: false as const,
          error: 'Este enlace ha alcanzado el limite de registros',
        }
      case 'paused':
        return {
          valid: false as const,
          error: 'Este enlace de invitacion esta temporalmente pausado',
        }
      default:
        return {
          valid: false as const,
          error: 'Este enlace de invitacion no esta activo',
        }
    }
  }

  if (isExpired(link.expiresAt, now)) {
    return {
      valid: false as const,
      error: 'Este enlace de invitacion ha expirado',
      statusToPersist: 'expired' as const,
    }
  }

  const currentUses = link.currentUses ?? 0
  const maxUses = link.maxUses ?? Number.POSITIVE_INFINITY

  if (currentUses >= maxUses) {
    return {
      valid: false as const,
      error: 'Este enlace ha alcanzado el limite de registros',
      statusToPersist: 'exhausted' as const,
    }
  }

  return { valid: true as const }
}
