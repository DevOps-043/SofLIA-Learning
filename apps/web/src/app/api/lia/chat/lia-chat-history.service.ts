import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../../../lib/supabase/types';
import type { ChatMessage, ChatRequest } from './platform-context.service';

interface PersistConversationTurnParams {
  conversationId?: string;
  userId?: string;
  requestContext: ChatRequest['context'];
  userMessage?: ChatMessage | null;
  assistantContent: string;
}

function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Configuracion incompleta de Supabase para historial de SofLIA'
    );
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function isValidUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function getLatestAssistantMessageContent(
  conversationId: string
): Promise<string | null> {
  if (!isValidUUID(conversationId)) {
    return null;
  }

  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const { data, error } = await supabaseAdmin
      .from('lia_messages')
      .select('content')
      .eq('conversation_id', conversationId)
      .eq('role', 'assistant')
      .order('message_sequence', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(
        'Error obteniendo el ultimo mensaje del asistente de SofLIA:',
        error
      );
      return null;
    }

    return data?.content ?? null;
  } catch (error) {
    console.error(
      'Error inicializando el acceso al historial de SofLIA:',
      error
    );
    return null;
  }
}

export async function persistConversationTurn({
  conversationId,
  userId,
  requestContext,
  userMessage,
  assistantContent,
}: PersistConversationTurnParams): Promise<void> {
  if (
    !conversationId ||
    !userId ||
    !isValidUUID(conversationId) ||
    !userMessage ||
    userMessage.role !== 'user'
  ) {
    return;
  }

  try {
    const supabaseAdmin = createSupabaseAdminClient();

    const { error: upsertError } = await supabaseAdmin
      .from('lia_conversations')
      .upsert(
        {
          conversation_id: conversationId,
          user_id: userId,
          context_type: requestContext?.currentLessonContext
            ? 'course'
            : 'general',
          course_id: requestContext?.currentLessonContext?.courseId || null,
          module_id: requestContext?.currentLessonContext?.moduleId || null,
          lesson_id: requestContext?.currentLessonContext?.lessonId || null,
          organization_id:
            typeof requestContext?.organizationId === 'string'
              ? requestContext.organizationId
              : null,
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'conversation_id' }
      );

    if (upsertError) {
      console.error('Error en upsert de conversacion de SofLIA:', upsertError);
      return;
    }

    const { data: lastMessageRecord, error: sequenceError } = await supabaseAdmin
      .from('lia_messages')
      .select('message_sequence')
      .eq('conversation_id', conversationId)
      .order('message_sequence', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sequenceError) {
      console.error(
        'Error obteniendo la secuencia de mensajes de SofLIA:',
        sequenceError
      );
      return;
    }

    const nextSequence = (lastMessageRecord?.message_sequence || 0) + 1;

    const { error: userMessageError } = await supabaseAdmin
      .from('lia_messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: userMessage.content,
        message_sequence: nextSequence,
      });

    if (userMessageError) {
      console.error(
        'Error guardando el mensaje del usuario en SofLIA:',
        userMessageError
      );
      return;
    }

    const { error: assistantMessageError } = await supabaseAdmin
      .from('lia_messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: assistantContent,
        model_used: 'gemini-1.5-flash',
        tokens_used: 0,
        message_sequence: nextSequence + 1,
      });

    if (assistantMessageError) {
      console.error(
        'Error guardando el mensaje del asistente en SofLIA:',
        assistantMessageError
      );
    }
  } catch (error) {
    console.error('Error persistiendo el turno de conversacion de SofLIA:', error);
  }
}
