import { logger } from '@/lib/utils/logger'
import { HierarchyChatsError } from '../../chat-collection/errors'
import { MESSAGE_WITH_SENDER_SELECT } from '../../chat-collection/message-select'
import type { HierarchyChatSupabaseClient } from '../../chat-collection/types'

export async function fetchChatMessages(
  supabase: HierarchyChatSupabaseClient,
  chatId: string,
  limit: number,
  before: string | null,
) {
  let query = supabase
    .from('hierarchy_chat_messages')
    .select(MESSAGE_WITH_SENDER_SELECT)
    .eq('chat_id', chatId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (before) query = query.lt('id', before)

  const { data, error } = await query
  if (error) {
    logger.error('Error obteniendo mensajes:', error)
    throw new HierarchyChatsError(500, {
      success: false,
      error: 'Error al obtener mensajes',
    })
  }

  return (data || []).reverse()
}

export async function fetchChatParticipants(
  supabase: HierarchyChatSupabaseClient,
  chatId: string,
) {
  const { data, error } = await supabase
    .from('hierarchy_chat_participants')
    .select(`
      *,
      user:users!hierarchy_chat_participants_user_id_fkey(
        id,
        display_name,
        first_name,
        last_name,
        email,
        profile_picture_url
      )
    `)
    .eq('chat_id', chatId)
    .eq('is_active', true)

  if (error) logger.error('Error obteniendo participantes:', error)
  return data || []
}
