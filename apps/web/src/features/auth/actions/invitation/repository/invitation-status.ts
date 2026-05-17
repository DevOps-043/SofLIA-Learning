import type { InvitationRepository } from '../types'
import { userInvitationsTable } from './tables'

type InvitationStatusMethods = Pick<
  InvitationRepository,
  | 'acceptInvitation'
  | 'markInvitationExpired'
  | 'refreshInvitation'
  | 'revokePendingInvitation'
>

export function createInvitationStatusMethods(
  supabase: unknown
): InvitationStatusMethods {
  return {
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

    async revokePendingInvitation(invitationId: string) {
      const { error } = await userInvitationsTable(supabase)
        .update({ status: 'revoked' })
        .eq('id', invitationId)
        .eq('status', 'pending')

      if (error) {
        throw error
      }
    },
  }
}
