import { HierarchyChatsError } from './errors'
import type { HierarchyChatSupabaseClient } from './types'

export async function fetchActiveChat(
  supabase: HierarchyChatSupabaseClient,
  chatId: string,
  organizationId: string,
) {
  const { data, error } = await supabase
    .from('hierarchy_chats')
    .select('*')
    .eq('id', chatId)
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    throw new HierarchyChatsError(404, {
      success: false,
      error: 'Chat no encontrado',
    })
  }

  return data
}

export async function assertChatParticipant(
  supabase: HierarchyChatSupabaseClient,
  chatId: string,
  userId: string,
) {
  const { data } = await supabase
    .from('hierarchy_chat_participants')
    .select('id')
    .eq('chat_id', chatId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()

  if (!data) {
    throw new HierarchyChatsError(403, {
      success: false,
      error: 'No tienes acceso a este chat',
    })
  }
}
