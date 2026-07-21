import { fromLoose } from '@/lib/supabase/looseQuery'
import { createAdminClient } from '@/lib/supabase/admin'

import type {
  ForensicLiaMessage,
  ForensicLiaTranscript,
} from './user-forensics.types'

type AdminSupabaseClient = ReturnType<typeof createAdminClient>

interface ConversationRow {
  conversation_id: string
  user_id: string
  context_type: string | null
}

interface MessageRow {
  message_id: string
  role: string | null
  content: string | null
  message_sequence: number | null
  is_off_topic: boolean | null
  created_at: string | null
}

function normalizeRole(role: string | null): ForensicLiaMessage['role'] {
  return role === 'assistant' || role === 'system' ? role : 'user'
}

/**
 * Transcripción del chat con el asistente LIA: qué preguntó el alumno y qué respondió
 * LIA. Acotada por `userId` (la conversación debe pertenecer al usuario).
 */
export async function getLiaTranscript(
  userId: string,
  conversationId: string,
  supabaseClient?: AdminSupabaseClient,
): Promise<ForensicLiaTranscript | null> {
  const supabase = supabaseClient ?? createAdminClient()

  const { data: conversation } = await fromLoose<ConversationRow>(supabase, 'lia_conversations')
    .select('conversation_id, user_id, context_type')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (!conversation) return null

  const { data: messages } = await fromLoose<MessageRow>(supabase, 'lia_messages')
    .select('message_id, role, content, message_sequence, is_off_topic, created_at')
    .eq('conversation_id', conversationId)
    .order('message_sequence', { ascending: true })
    .limit(1000)

  const normalized: ForensicLiaMessage[] = (messages ?? []).map((row) => ({
    id: row.message_id,
    role: normalizeRole(row.role),
    content: row.content ?? '',
    sequence: Number(row.message_sequence ?? 0),
    isOffTopic: Boolean(row.is_off_topic),
    createdAtUtc: row.created_at,
  }))

  return {
    conversationId: conversation.conversation_id,
    contextType: conversation.context_type,
    messages: normalized,
  }
}
