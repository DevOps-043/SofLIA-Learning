import { logger as techDebtLogger } from '@/lib/utils/logger'
import { createClient } from '../../../supabase/server';
import { conversationsTable, messagesTable, userFeedbackTable } from '../lia-logger-events';

export async function endLiaConversation(
  conversationId: string,
  completed: boolean
) {
  const supabase = await createClient();
  const { error } = await conversationsTable(supabase)
    .update({ ended_at: new Date().toISOString(), is_completed: completed })
    .eq('conversation_id', conversationId);

  if (error) {
    throw error;
  }
}

export async function recoverLiaMessageSequence(conversationId: string) {
  const supabase = await createClient();
  const { data, error } = await messagesTable(supabase)
    .select('message_sequence')
    .eq('conversation_id', conversationId)
    .order('message_sequence', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    techDebtLogger.error('[LiaLogger] Error recovering message sequence:', error);
  }

  return data?.message_sequence || 0;
}

export async function logLiaFeedback({
  comment,
  conversationId,
  feedbackType,
  messageId,
  rating,
  userId
}: {
  comment?: string;
  conversationId: string;
  feedbackType: 'helpful' | 'not_helpful' | 'incorrect' | 'confusing';
  messageId: string;
  rating?: number;
  userId: string;
}) {
  const supabase = await createClient();
  const { error } = await userFeedbackTable(supabase).insert({
    message_id: messageId,
    conversation_id: conversationId,
    user_id: userId,
    feedback_type: feedbackType,
    rating: rating || null,
    comment: comment || null
  });

  if (error) {
    throw error;
  }
}
