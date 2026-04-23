import { logger } from '@/lib/utils/logger'
import { HierarchyChatsError } from '../../../chat-collection/errors'
import { MESSAGE_WITH_SENDER_SELECT } from '../../../chat-collection/message-select'
import type {
  BusinessAuthContext,
  HierarchyChatSupabaseClient,
} from '../../../chat-collection/types'

export async function createChatMessage(
  supabase: HierarchyChatSupabaseClient,
  chatId: string,
  auth: BusinessAuthContext,
  content: string,
  body: Record<string, unknown>,
) {
  const { data, error } = await supabase
    .from('hierarchy_chat_messages')
    .insert({
      chat_id: chatId,
      organization_id: auth.organizationId,
      sender_id: auth.userId,
      content,
      message_type: body.message_type || 'text',
      metadata: body.metadata || {},
    })
    .select(MESSAGE_WITH_SENDER_SELECT)
    .single()

  if (error || !data) {
    logger.error('Error creando mensaje:', error)
    throw new HierarchyChatsError(500, {
      success: false,
      error: 'Error al enviar el mensaje',
    })
  }

  return data
}
