import { logger } from '@/lib/utils/logger'
import { HierarchyChatsError } from '../../../../chat-collection/errors'
import { MESSAGE_WITH_SENDER_SELECT } from '../../../../chat-collection/message-select'
import type { HierarchyChatSupabaseClient } from '../../../../chat-collection/types'

export async function updateHierarchyChatMessage(
  supabase: HierarchyChatSupabaseClient,
  messageId: string,
  content: string,
) {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('hierarchy_chat_messages')
    .update({
      content,
      is_edited: true,
      edited_at: now,
      updated_at: now,
    })
    .eq('id', messageId)
    .select(MESSAGE_WITH_SENDER_SELECT)
    .single()

  if (error || !data) {
    logger.error('Error actualizando mensaje:', error)
    throw new HierarchyChatsError(500, {
      success: false,
      error: 'Error al actualizar el mensaje',
    })
  }

  return data
}
