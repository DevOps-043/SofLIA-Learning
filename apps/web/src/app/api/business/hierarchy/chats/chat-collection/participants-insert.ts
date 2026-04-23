import { logger } from '@/lib/utils/logger'
import type {
  BusinessAuthContext,
  HierarchyChatRpcParticipant,
  HierarchyChatSupabaseClient,
} from './types'

export async function insertHierarchyChatParticipants(
  supabase: HierarchyChatSupabaseClient,
  chatId: string,
  auth: BusinessAuthContext,
  participants: HierarchyChatRpcParticipant[],
) {
  const participantUserIds = new Set(participants.map((participant) => participant.user_id))
  participantUserIds.add(auth.userId)

  const participantInserts = Array.from(participantUserIds).map((userId) => ({
    chat_id: chatId,
    user_id: userId,
    organization_id: auth.organizationId,
    is_active: true,
    unread_count: 0,
  }))

  const { error } = await supabase
    .from('hierarchy_chat_participants')
    .insert(participantInserts)

  if (error) {
    logger.error('Error insertando participantes:', error)
    await insertCurrentUserParticipant(supabase, chatId, auth)
  }
}

async function insertCurrentUserParticipant(
  supabase: HierarchyChatSupabaseClient,
  chatId: string,
  auth: BusinessAuthContext,
) {
  await supabase
    .from('hierarchy_chat_participants')
    .insert({
      chat_id: chatId,
      user_id: auth.userId,
      organization_id: auth.organizationId,
      is_active: true,
      unread_count: 0,
    })
    .select()
    .single()
}
