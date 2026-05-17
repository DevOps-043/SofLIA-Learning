import { createClient } from '../../../supabase/server';
import type { ConversationMetadata } from '../lia-logger-events';
import { conversationsTable, messagesTable } from '../lia-logger-events';

const MAX_CONVERSATIONS_PER_CONTEXT = 5;

export async function startLiaConversation(
  userId: string,
  metadata: ConversationMetadata
): Promise<string> {
  const supabase = await createClient();
  await pruneOldConversations(userId, metadata.contextType, supabase);

  const { data, error } = await conversationsTable(supabase)
    .insert({
      user_id: userId,
      context_type: metadata.contextType,
      course_id: metadata.courseContext?.courseId || null,
      module_id: metadata.courseContext?.moduleId || null,
      lesson_id: metadata.courseContext?.lessonId || null,
      activity_id: null,
      device_type: metadata.deviceType || null,
      browser: metadata.browser || null,
      ip_address: metadata.ipAddress || null
    })
    .select('conversation_id')
    .single();

  if (error) {
    console.error('[SofLIALogger] Error starting conversation:', error);
    throw error;
  }

  return data?.conversation_id || '';
}

async function pruneOldConversations(
  userId: string,
  contextType: ConversationMetadata['contextType'],
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const { data: existingConversations, error } = await conversationsTable(supabase)
    .select('conversation_id, started_at')
    .eq('user_id', userId)
    .eq('context_type', contextType)
    .order('started_at', { ascending: false });

  if (error || !existingConversations || existingConversations.length < MAX_CONVERSATIONS_PER_CONTEXT) {
    return;
  }

  const idsToDelete = existingConversations
    .slice(MAX_CONVERSATIONS_PER_CONTEXT - 1)
    .map((conversation) => conversation.conversation_id);

  if (idsToDelete.length === 0) {
    return;
  }

  await messagesTable(supabase).delete().in('conversation_id', idsToDelete);
  await conversationsTable(supabase).delete().in('conversation_id', idsToDelete);
}
