import { HierarchyChatsError } from '../../../../chat-collection/errors'
import type { HierarchyChatSupabaseClient } from '../../../../chat-collection/types'

interface MessageOwnershipOptions {
  ownMessageError: string
  deletedMessageError: string
}

export async function fetchOwnedMessage(
  supabase: HierarchyChatSupabaseClient,
  chatId: string,
  messageId: string,
  userId: string,
  options: MessageOwnershipOptions,
) {
  const { data } = await supabase
    .from('hierarchy_chat_messages')
    .select('id, sender_id, chat_id, is_deleted')
    .eq('id', messageId)
    .eq('chat_id', chatId)
    .single()

  if (!data) throw createMessageError(404, 'Mensaje no encontrado')
  if (data.sender_id !== userId) throw createMessageError(403, options.ownMessageError)
  if (data.is_deleted) throw createMessageError(400, options.deletedMessageError)

  return data
}

function createMessageError(status: number, error: string) {
  return new HierarchyChatsError(status, { success: false, error })
}
