import type {
  BulkInviteLinkRecord,
  BulkInviteLinkWrite,
  InvitationRepository,
} from '../types'
import { toBulkInviteLinkRecord } from './mappers'
import {
  bulkInviteLinksTable,
  bulkInviteRegistrationsTable,
} from './tables'

type BulkInviteMethods = Pick<
  InvitationRepository,
  | 'createBulkInviteRegistration'
  | 'getBulkInviteLinkByToken'
  | 'markBulkInviteLinkStatus'
  | 'reserveBulkInviteUse'
>

export function createBulkInviteRepositoryMethods(
  supabase: unknown
): BulkInviteMethods {
  return {
    async createBulkInviteRegistration(linkId: string, userId: string) {
      const { error } = await bulkInviteRegistrationsTable(supabase).insert({
        bulk_invite_link_id: linkId,
        user_id: userId,
      })

      if (error) {
        throw error
      }
    },

    async getBulkInviteLinkByToken(
      token: string
    ): Promise<BulkInviteLinkRecord | null> {
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

    async markBulkInviteLinkStatus(linkId: string, status: string) {
      const { error } = await bulkInviteLinksTable(supabase)
        .update({ status })
        .eq('id', linkId)

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

      const baseQuery = bulkInviteLinksTable(supabase)
        .update(payload)
        .eq('id', linkId)

      const guardedQuery =
        expectedCurrentUses === null
          ? baseQuery.is('current_uses', null)
          : baseQuery.eq('current_uses', expectedCurrentUses)

      const { data, error } = await guardedQuery
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
