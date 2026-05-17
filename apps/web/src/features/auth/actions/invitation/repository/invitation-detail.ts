import type {
  InvitationRecord,
  InvitationRepository,
} from '../types'
import { toInvitationRecord } from './mappers'
import { userInvitationsTable } from './tables'

type InvitationDetailMethods = Pick<
  InvitationRepository,
  'getInvitationById' | 'getInvitationByToken' | 'getInvitationForConsume'
>

export function createInvitationDetailMethods(
  supabase: unknown
): InvitationDetailMethods {
  return {
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
  }
}
