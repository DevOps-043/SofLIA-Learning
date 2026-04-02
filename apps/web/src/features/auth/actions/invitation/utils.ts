import { inviteUserSchema } from './schemas'
import {
  getInvitationPosition as getInvitationMetadataPosition,
  isExpired,
  isInvitationToken as isInvitationTokenValue,
  normalizeEmail as normalizeInvitationEmail,
} from './shared'
import type {
  InviteUserActionInput,
  InviteUserInput,
  OrganizationInvitationListItem,
  UserInvitationMetadata,
  UserInvitationRow,
  UserInvitationWrite,
} from './types'

export function parseInviteUserInput(input: InviteUserActionInput): InviteUserInput {
  if (input instanceof FormData) {
    return inviteUserSchema.parse({
      customMessage: input.get('customMessage') || undefined,
      email: input.get('email'),
      organizationId: input.get('organizationId'),
      position: input.get('position') || undefined,
      role: input.get('role') || 'member',
    })
  }

  return inviteUserSchema.parse({
    ...input,
    role: input.role || 'member',
  })
}

export function normalizeEmail(email: string) {
  return normalizeInvitationEmail(email)
}

export function isInvitationToken(value: string) {
  return isInvitationTokenValue(value)
}

export function getInvitationPosition(
  metadata?: UserInvitationMetadata | null
): string | undefined {
  return getInvitationMetadataPosition(metadata)
}

export function hasInvitationExpired(expiresAt: string, now = new Date()) {
  return isExpired(expiresAt, now)
}

export function buildInvitationWritePayload(
  data: InviteUserInput,
  token: string,
  expiresAt: string
): UserInvitationWrite {
  return {
    email: normalizeEmail(data.email),
    expires_at: expiresAt,
    metadata: {
      custom_message: data.customMessage ?? null,
      position: data.position ?? null,
    },
    organization_id: data.organizationId,
    role: data.role ?? 'member',
    token,
  }
}

export function getInvitationStatusError(status: string): string {
  if (status === 'accepted') {
    return 'Esta invitacion ya fue utilizada'
  }

  if (status === 'revoked') {
    return 'Esta invitacion fue revocada'
  }

  return 'Esta invitacion ya no es valida'
}

export function mapOrganizationInvitationListItem(
  invitation: Pick<
    UserInvitationRow,
    'id' | 'email' | 'role' | 'status' | 'created_at' | 'expires_at' | 'metadata'
  >
): OrganizationInvitationListItem {
  return {
    created_at: invitation.created_at ?? '',
    email: invitation.email,
    expires_at: invitation.expires_at,
    id: invitation.id,
    metadata: invitation.metadata,
    role: invitation.role,
    status: invitation.status,
  }
}
