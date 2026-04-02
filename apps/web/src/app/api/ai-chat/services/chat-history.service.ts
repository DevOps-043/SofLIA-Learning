import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

interface PersistAiChatHistoryParams {
  supabase: SupabaseServerClient
  userId: string
  context: string
  message: string
  response: string
  lessonTitle?: string
}

interface ChatHistoryInsert {
  user_id: string
  context: string
  user_message: string
  assistant_response: string
  lesson_id: string | null
  created_at: string
}

export async function persistAiChatHistory({
  supabase,
  userId,
  context,
  message,
  response,
  lessonTitle,
}: PersistAiChatHistoryParams) {
  const payload: ChatHistoryInsert = {
    user_id: userId,
    context,
    user_message: message,
    assistant_response: response,
    lesson_id: lessonTitle ? lessonTitle.substring(0, 100) : null,
    created_at: new Date().toISOString(),
  }

  try {
    const { error } = await supabase
      .from('ai_chat_history' as never)
      .insert(payload as never)

    if (error) {
      logger.error('Error guardando historial de chat:', error)
    }
  } catch (error) {
    logger.error('Error guardando historial de chat:', error)
  }
}
