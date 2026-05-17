import { createClient } from '../../../supabase/server';
import type { LooseWriteRow, MessageMetadata, MessageRole } from '../lia-logger-events';
import { conversationsTable, messagesTable } from '../lia-logger-events';

interface LogLiaMessageParams {
  content: string;
  conversationId: string;
  isSystemMessage: boolean;
  messageSequence: number;
  metadata?: MessageMetadata;
  role: MessageRole;
}

export async function logLiaMessage({
  content,
  conversationId,
  isSystemMessage,
  messageSequence,
  metadata,
  role
}: LogLiaMessageParams) {
  const supabase = await createClient();
  const { data, error } = await messagesTable(supabase)
    .insert({
      conversation_id: conversationId,
      role,
      content,
      is_system_message: isSystemMessage,
      model_used: metadata?.modelUsed || null,
      tokens_used: metadata?.tokensUsed || null,
      cost_usd: metadata?.costUsd || null,
      response_time_ms: metadata?.responseTimeMs || null,
      message_sequence: messageSequence,
      created_at: new Date().toISOString()
    })
    .select('message_id')
    .single();

  if (error?.code === '23503') {
    return { conversationDeleted: true, messageId: '' };
  }
  if (error) {
    console.error('[SofLIALogger] Error logging message:', error);
    throw error;
  }

  await updateConversationCounters(conversationId, role, supabase);
  return { conversationDeleted: false, messageId: data?.message_id || '' };
}

async function updateConversationCounters(
  conversationId: string,
  role: MessageRole,
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  try {
    const { data } = await conversationsTable(supabase)
      .select('total_messages, total_lia_messages')
      .eq('conversation_id', conversationId)
      .single();

    if (!data) {
      return;
    }

    const updates: LooseWriteRow = {
      total_messages: (data.total_messages || 0) + 1
    };

    if (role === 'assistant') {
      updates.total_lia_messages = (data.total_lia_messages || 0) + 1;
    }

    await conversationsTable(supabase).update(updates).eq('conversation_id', conversationId);
  } catch (_error) {
    // Message persistence should not fail because aggregate counters failed.
  }
}
