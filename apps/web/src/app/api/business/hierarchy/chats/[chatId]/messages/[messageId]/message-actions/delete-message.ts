import { logger } from '@/lib/utils/logger'
import { HierarchyChatsError } from '../../../../chat-collection/errors'
import type { HierarchyChatSupabaseClient } from '../../../../chat-collection/types'

export async function deleteHierarchyChatMessage(
  supabase: HierarchyChatSupabaseClient,
  messageId: string,
) {
  const now = new Date().toISOString()
  const { error } = await supabase
    .from('hierarchy_chat_messages')
    .update({
      is_deleted: true,
      deleted_at: now,
      updated_at: now,
    })
    .eq('id', messageId)

  if (error) {
    logger.error('Error eliminando mensaje:', error)
    throw new HierarchyChatsError(500, {
      success: false,
      error: 'Error al eliminar el mensaje',
    })
  }
}
