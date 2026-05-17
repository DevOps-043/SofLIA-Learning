import type {
  InvitationRecord,
  InvitationRepository,
  InvitationStatus,
} from '../types'
import { toInvitationRecord } from './mappers'
import { userInvitationsTable } from './tables'

type InvitationListMethods = Pick<InvitationRepository, 'listOrganizationInvitations'>

export function createInvitationListMethods(
  supabase: unknown
): InvitationListMethods {
  return {
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
  }
}
