import { fromLoose } from '@/lib/supabase/looseQuery'

import type {
  BulkInviteLinkRow,
  BulkInviteLinkWrite,
  BulkInviteRegistrationWrite,
  OrganizationRow,
  OrganizationUserRow,
  OrganizationUserWrite,
  RefreshTokenRow,
  UserInvitationRow,
  UserInvitationWrite,
  UserRow,
  UserSessionRow,
} from '../types'

export function usersTable(client: unknown) {
  return fromLoose<UserRow, Partial<UserRow>>(client, 'users')
}

export function organizationsTable(client: unknown) {
  return fromLoose<OrganizationRow>(client, 'organizations')
}

export function organizationUsersTable(client: unknown) {
  return fromLoose<OrganizationUserRow, OrganizationUserWrite>(
    client,
    'organization_users'
  )
}

export function userInvitationsTable(client: unknown) {
  return fromLoose<UserInvitationRow, UserInvitationWrite>(
    client,
    'user_invitations'
  )
}

export function userSessionsTable(client: unknown) {
  return fromLoose<UserSessionRow>(client, 'user_session')
}

export function refreshTokensTable(client: unknown) {
  return fromLoose<RefreshTokenRow>(client, 'refresh_tokens')
}

export function bulkInviteLinksTable(client: unknown) {
  return fromLoose<BulkInviteLinkRow, BulkInviteLinkWrite>(
    client,
    'bulk_invite_links'
  )
}

export function bulkInviteRegistrationsTable(client: unknown) {
  return fromLoose<never, BulkInviteRegistrationWrite>(
    client,
    'bulk_invite_registrations'
  )
}
