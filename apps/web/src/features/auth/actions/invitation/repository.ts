import { createHash } from 'crypto'
import { cookies } from 'next/headers'

import { fromLoose } from '@/lib/supabase/looseQuery'

import type {
  BulkInviteLinkRow,
  BulkInviteLinkWrite,
  BulkInviteLinkRecord,
  BulkInviteRegistrationWrite,
  CreateInvitationInput,
  CreateOrganizationMembershipInput,
  InvitationRecord,
  InvitationRepository,
  InvitationStatus,
  OrganizationRow,
  OrganizationUserRow,
  OrganizationUserWrite,
  OrganizationMembershipRecord,
  OrganizationSummary,
  RefreshTokenRow,
  UserInvitationRow,
  UserInvitationWrite,
  UserRow,
  UserSessionRow,
  UserRecord,
} from './types'

function usersTable(client: unknown) {
  return fromLoose<UserRow, Partial<UserRow>>(client, 'users')
}

function organizationsTable(client: unknown) {
  return fromLoose<OrganizationRow>(client, 'organizations')
}

function organizationUsersTable(client: unknown) {
  return fromLoose<OrganizationUserRow, OrganizationUserWrite>(
    client,
    'organization_users'
  )
}

function userInvitationsTable(client: unknown) {
  return fromLoose<UserInvitationRow, UserInvitationWrite>(
    client,
    'user_invitations'
  )
}

function userSessionsTable(client: unknown) {
  return fromLoose<UserSessionRow>(client, 'user_session')
}

function refreshTokensTable(client: unknown) {
  return fromLoose<RefreshTokenRow>(client, 'refresh_tokens')
}

function bulkInviteLinksTable(client: unknown) {
  return fromLoose<BulkInviteLinkRow, BulkInviteLinkWrite>(
    client,
    'bulk_invite_links'
  )
}

function bulkInviteRegistrationsTable(client: unknown) {
  return fromLoose<never, BulkInviteRegistrationWrite>(
    client,
    'bulk_invite_registrations'
  )
}

function normalizeOrganizationSummary(
  organization?: OrganizationRow | OrganizationRow[] | null
): OrganizationSummary | null {
  const row = Array.isArray(organization) ? organization[0] : organization

  if (!row) {
    return null
  }

  return {
    id: row.id,
    logoUrl: row.logo_url ?? null,
    name: row.name ?? null,
    slug: row.slug ?? null,
  }
}

function toInvitationRecord(row: UserInvitationRow): InvitationRecord {
  return {
    createdAt: row.created_at ?? null,
    email: row.email,
    expiresAt: row.expires_at,
    id: row.id,
    metadata: row.metadata ?? null,
    organization: normalizeOrganizationSummary(row.organizations),
    organizationId: row.organization_id,
    role: row.role,
    status: row.status,
    token: row.token,
  }
}

function toBulkInviteLinkRecord(row: BulkInviteLinkRow): BulkInviteLinkRecord {
  return {
    currentUses: row.current_uses ?? null,
    expiresAt: row.expires_at,
    id: row.id,
    maxUses: row.max_uses ?? null,
    organizationId: row.organization_id,
    role: row.role,
    status: row.status,
  }
}

export function createInvitationRepository(supabase: unknown): InvitationRepository {
  return {
    async addOrganizationMembership(input: CreateOrganizationMembershipInput) {
      const { error } = await organizationUsersTable(supabase).insert({
        joined_at: input.joinedAt,
        organization_id: input.organizationId,
        role: input.role,
        status: input.status,
        user_id: input.userId,
      })

      if (error) {
        throw error
      }
    },

    async acceptInvitation(invitationId: string, acceptedAt: string) {
      const { error } = await userInvitationsTable(supabase)
        .update({
          accepted_at: acceptedAt,
          status: 'accepted',
        })
        .eq('id', invitationId)

      if (error) {
        throw error
      }
    },

    async createBulkInviteRegistration(linkId: string, userId: string) {
      const { error } = await bulkInviteRegistrationsTable(supabase).insert({
        bulk_invite_link_id: linkId,
        user_id: userId,
      })

      if (error) {
        throw error
      }
    },

    async createInvitation(input: CreateInvitationInput) {
      const { data, error } = await userInvitationsTable(supabase)
        .insert({
          email: input.email,
          expires_at: input.expiresAt,
          metadata: input.metadata,
          organization_id: input.organizationId,
          role: input.role,
          token: input.token,
        })
        .select('id')
        .single()

      if (error || !data) {
        throw error ?? new Error('Error creating invitation')
      }

      return { id: data.id }
    },

    async findOrganizationMembership(
      userId: string,
      organizationId: string
    ): Promise<OrganizationMembershipRecord | null> {
      const { data } = await organizationUsersTable(supabase)
        .select('id')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .single()

      return data ?? null
    },

    async findPendingInvitationByEmail(
      email: string,
      organizationId: string
    ): Promise<InvitationRecord | null> {
      const { data } = await userInvitationsTable(supabase)
        .select('id, email, token, role, status, expires_at, organization_id, metadata, created_at')
        .eq('organization_id', organizationId)
        .eq('status', 'pending')
        .ilike('email', email)
        .single()

      return data ? toInvitationRecord(data) : null
    },

    async findUserByEmail(email: string): Promise<UserRecord | null> {
      const { data } = await usersTable(supabase)
        .select('id, cargo_rol')
        .ilike('email', email)
        .single()

      return data
        ? {
            cargoRol: data.cargo_rol ?? null,
            id: data.id,
          }
        : null
    },

    async findUserById(userId: string): Promise<UserRecord | null> {
      const { data } = await usersTable(supabase)
        .select('id, cargo_rol')
        .eq('id', userId)
        .single()

      return data
        ? {
            cargoRol: data.cargo_rol ?? null,
            id: data.id,
          }
        : null
    },

    async getBulkInviteLinkByToken(token: string): Promise<BulkInviteLinkRecord | null> {
      const { data } = await bulkInviteLinksTable(supabase)
        .select(`
          id,
          role,
          max_uses,
          current_uses,
          expires_at,
          status,
          organization_id
        `)
        .eq('token', token)
        .single()

      return data ? toBulkInviteLinkRecord(data) : null
    },

    async getInvitationById(invitationId: string): Promise<InvitationRecord | null> {
      const { data } = await userInvitationsTable(supabase)
        .select(`
          id,
          email,
          token,
          role,
          status,
          expires_at,
          organization_id,
          metadata,
          created_at,
          organizations (
            name,
            slug,
            logo_url
          )
        `)
        .eq('id', invitationId)
        .single()

      return data ? toInvitationRecord(data) : null
    },

    async getInvitationByToken(token: string): Promise<InvitationRecord | null> {
      const { data } = await userInvitationsTable(supabase)
        .select(`
          id,
          email,
          token,
          role,
          status,
          expires_at,
          organization_id,
          metadata,
          created_at,
          organizations (
            id,
            name,
            slug,
            logo_url
          )
        `)
        .eq('token', token)
        .single()

      return data ? toInvitationRecord(data) : null
    },

    async getInvitationForConsume(
      tokenOrEmail: string,
      organizationId: string,
      lookupByToken: boolean
    ): Promise<InvitationRecord | null> {
      const query = userInvitationsTable(supabase)
        .select('id, email, token, role, status, expires_at, organization_id, metadata, created_at')
        .eq('status', 'pending')

      const { data } = lookupByToken
        ? await query.eq('token', tokenOrEmail).single()
        : await query
            .eq('organization_id', organizationId)
            .ilike('email', tokenOrEmail)
            .single()

      return data ? toInvitationRecord(data) : null
    },

    async getOrganizationById(organizationId: string): Promise<OrganizationSummary | null> {
      const { data } = await organizationsTable(supabase)
        .select('id, name, slug, logo_url')
        .eq('id', organizationId)
        .single()

      return normalizeOrganizationSummary(data)
    },

    async getOrganizationSlug(organizationId: string): Promise<string | null> {
      const { data } = await organizationsTable(supabase)
        .select('slug')
        .eq('id', organizationId)
        .single()

      return data?.slug ?? null
    },

    async listOrganizationInvitations(
      organizationId: string,
      status?: InvitationStatus
    ): Promise<InvitationRecord[]> {
      let query = userInvitationsTable(supabase)
        .select('id, email, token, role, status, expires_at, organization_id, metadata, created_at')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      return (data ?? []).map(toInvitationRecord)
    },

    async markBulkInviteLinkStatus(linkId: string, status: string) {
      const { error } = await bulkInviteLinksTable(supabase)
        .update({ status })
        .eq('id', linkId)

      if (error) {
        throw error
      }
    },

    async markInvitationExpired(invitationId: string) {
      const { error } = await userInvitationsTable(supabase)
        .update({ status: 'expired' })
        .eq('id', invitationId)

      if (error) {
        throw error
      }
    },

    async refreshInvitation(
      invitationId: string,
      token: string,
      expiresAt: string
    ) {
      const { error } = await userInvitationsTable(supabase)
        .update({
          expires_at: expiresAt,
          token,
        })
        .eq('id', invitationId)

      if (error) {
        throw error
      }
    },

    async resolveAuthenticatedUserId(): Promise<string | null> {
      const cookieStore = await cookies()
      const sessionCookie = cookieStore.get('aprende-y-aplica-session')

      if (sessionCookie?.value) {
        const { data: session } = await userSessionsTable(supabase)
          .select('user_id')
          .eq('jwt_id', sessionCookie.value)
          .eq('revoked', false)
          .gt('expires_at', new Date().toISOString())
          .single()

        if (session?.user_id) {
          return session.user_id
        }
      }

      const refreshTokenCookie = cookieStore.get('refresh_token')
      const accessTokenCookie = cookieStore.get('access_token')

      if (!refreshTokenCookie?.value || !accessTokenCookie?.value) {
        return null
      }

      const tokenHash = createHash('sha256')
        .update(refreshTokenCookie.value)
        .digest('hex')

      const { data: refreshToken } = await refreshTokensTable(supabase)
        .select('user_id')
        .eq('token_hash', tokenHash)
        .eq('is_revoked', false)
        .gt('expires_at', new Date().toISOString())
        .single()

      return refreshToken?.user_id ?? null
    },

    async revokePendingInvitation(invitationId: string) {
      const { error } = await userInvitationsTable(supabase)
        .update({ status: 'revoked' })
        .eq('id', invitationId)
        .eq('status', 'pending')

      if (error) {
        throw error
      }
    },

    async setUserBusinessRole(userId: string) {
      const { error } = await usersTable(supabase)
        .update({ cargo_rol: 'Business' })
        .eq('id', userId)
        .neq('cargo_rol', 'Administrador')

      if (error) {
        throw error
      }
    },

    async reserveBulkInviteUse(
      linkId: string,
      expectedCurrentUses: number | null,
      nextUses: number,
      nextStatus?: string
    ) {
      const payload: BulkInviteLinkWrite = {
        current_uses: nextUses,
      }

      if (nextStatus) {
        payload.status = nextStatus
      }

      let query = bulkInviteLinksTable(supabase)
        .update(payload)
        .eq('id', linkId)

      query =
        expectedCurrentUses === null
          ? query.is('current_uses', null)
          : query.eq('current_uses', expectedCurrentUses)

      const { data, error } = await query
        .eq('status', 'active')
        .select('id')
        .maybeSingle()

      if (error) {
        throw error
      }

      return Boolean(data)
    },
  }
}
