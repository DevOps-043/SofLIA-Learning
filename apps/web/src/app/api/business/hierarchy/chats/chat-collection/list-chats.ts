import { logger } from '@/lib/utils/logger'
import {
  createMissingChatTableError,
  HierarchyChatsError,
  isMissingChatTableError,
} from './errors'
import type {
  BusinessAuthContext,
  HierarchyChatParticipantRow,
  HierarchyChatRow,
  HierarchyChatSupabaseClient,
  ListChatsParams,
} from './types'

export async function listHierarchyChats(
  supabase: HierarchyChatSupabaseClient,
  auth: BusinessAuthContext,
  params: ListChatsParams,
) {
  let query = supabase
    .from('hierarchy_chats')
    .select('*')
    .eq('organization_id', auth.organizationId)
    .eq('entity_type', params.entityType)
    .eq('entity_id', params.entityId)
    .eq('is_active', true)

  if (params.chatType) query = query.eq('chat_type', params.chatType)

  const { data: chats, error } = await query.order('last_message_at', {
    ascending: false,
    nullsFirst: false,
  })

  if (error) {
    logger.error('Error obteniendo chats:', {
      error,
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    })
    if (isMissingChatTableError(error)) throw createMissingChatTableError(error.message)

    throw new HierarchyChatsError(500, {
      success: false,
      error: 'Error al obtener chats',
      details: error.message || 'Error desconocido',
    })
  }

  return Promise.all(
    ((chats as HierarchyChatRow[] | null) || []).map((chat) =>
      enrichChatWithParticipantCounts(supabase, auth.userId, chat),
    ),
  )
}

async function enrichChatWithParticipantCounts(
  supabase: HierarchyChatSupabaseClient,
  userId: string,
  chat: HierarchyChatRow,
) {
  const { data: participants } = await supabase
    .from('hierarchy_chat_participants')
    .select('id, user_id, is_active, unread_count, last_read_at')
    .eq('chat_id', chat.id)
    .eq('is_active', true)

  const activeParticipants = (participants as HierarchyChatParticipantRow[] | null) || []
  const userParticipant = activeParticipants.find((participant) => participant.user_id === userId)

  return {
    ...chat,
    participants_count: activeParticipants.length,
    unread_count: userParticipant?.unread_count || 0,
  }
}
