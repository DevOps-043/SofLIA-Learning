import type {
  CreateInvitationInput,
  InvitationRecord,
  InvitationRepository,
} from '../types'
import { toInvitationRecord } from './mappers'
import { userInvitationsTable } from './tables'

type InvitationCreateMethods = Pick<
  InvitationRepository,
  'createInvitation' | 'findPendingInvitationByEmail'
>

export function createInvitationCreateMethods(
  supabase: unknown
): InvitationCreateMethods {
  return {
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
  }
}
