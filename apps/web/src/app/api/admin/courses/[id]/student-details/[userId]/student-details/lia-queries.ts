import { SupabaseClient } from '@supabase/supabase-js'
import { LiaConversationRow, LiaFeedbackRow, LiaMessageRow } from './types'

export async function getLiaQueryData(supabase: SupabaseClient, userId: string) {
  const { data: liaConversations } = await supabase
    .from('lia_conversations')
    .select('conversation_id, created_at, context_type')
    .eq('user_id', userId)

  const conversationIds = liaConversations?.map((conversation) => conversation.conversation_id) ?? []
  if (conversationIds.length === 0) {
    return { liaConversations: [] as LiaConversationRow[], liaMessages: [] as LiaMessageRow[], liaFeedback: [] as LiaFeedbackRow[] }
  }

  const [{ data: liaMessages }, { data: liaFeedback }] = await Promise.all([
    supabase
      .from('lia_messages')
      .select('conversation_id, created_at, sender, role')
      .in('conversation_id', conversationIds),
    supabase
      .from('lia_user_feedback')
      .select('feedback_id, conversation_id, rating, feedback_type')
      .in('conversation_id', conversationIds),
  ])

  return {
    liaConversations: (liaConversations as LiaConversationRow[]) ?? [],
    liaMessages: (liaMessages as LiaMessageRow[]) ?? [],
    liaFeedback: (liaFeedback as LiaFeedbackRow[]) ?? [],
  }
}
