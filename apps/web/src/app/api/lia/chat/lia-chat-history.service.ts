import 'server-only'
import { logger as techDebtLogger } from '@/lib/utils/logger'
import { getAiModelSettings } from '@/lib/ai/model-settings/ai-model-settings.server.service'
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../../../lib/supabase/types';
import type { ChatMessage, ChatRequest } from './platform-context.service';
import { enqueueLessonAutoNoteJob } from '@/features/notebook/services/notebook-generation.server.service';

/**
 * El modelo se resuelve por llamada, no como constante de módulo: la
 * configuración es administrable en caliente desde el panel de superadmin y una
 * constante evaluada al cargar el módulo dejaría el histórico registrando un
 * modelo obsoleto hasta el siguiente reinicio del proceso.
 */
async function resolveLiaChatModel(): Promise<string> {
  const settings = await getAiModelSettings('lia_general');
  return settings.model;
}

interface PersistConversationTurnParams {
  conversationId?: string;
  userId?: string;
  requestContext: ChatRequest['context'];
  userMessage?: ChatMessage | null;
  assistantContent: string;
}

export interface PersistedConversationTurn {
  assistantMessageId: string | null;
  conversationId: string;
  userMessageId: string;
}

interface EnrollmentScopeRow {
  enrollment_id: string;
  organization_id: string | null;
}

async function resolveEnrollmentScope(
  supabaseAdmin: ReturnType<typeof createSupabaseAdminClient>,
  userId: string,
  requestContext: ChatRequest['context'],
): Promise<EnrollmentScopeRow | null> {
  const courseId = requestContext?.currentLessonContext?.courseId;
  if (!courseId) return null;

  let query = supabaseAdmin
    .from('user_course_enrollments')
    .select('enrollment_id, organization_id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .neq('enrollment_status', 'cancelled');

  const organizationId =
    typeof requestContext?.organizationId === 'string'
      ? requestContext.organizationId
      : null;
  query = organizationId
    ? query.eq('organization_id', organizationId)
    : query.is('organization_id', null);

  const requestedEnrollmentId =
    requestContext?.currentLessonContext?.enrollmentId;
  if (requestedEnrollmentId && isValidUUID(requestedEnrollmentId)) {
    query = query.eq('enrollment_id', requestedEnrollmentId);
  }

  const { data, error } = await query
    .order('last_accessed_at', { ascending: false })
    .limit(1)
    .maybeSingle<EnrollmentScopeRow>();

  if (error) {
    techDebtLogger.warn('No se pudo resolver la inscripcion del chat SofLIA', {
      error: error.message,
      userId,
    });
    return null;
  }

  return data || null;
}

async function resolveActivityId(
  supabaseAdmin: ReturnType<typeof createSupabaseAdminClient>,
  requestContext: ChatRequest['context'],
): Promise<string | null> {
  const activityId = requestContext?.currentActivityContext?.id;
  const lessonId = requestContext?.currentLessonContext?.lessonId;
  if (!activityId || !lessonId || !isValidUUID(activityId)) return null;

  const { data } = await supabaseAdmin
    .from('lesson_activities')
    .select('activity_id')
    .eq('activity_id', activityId)
    .eq('lesson_id', lessonId)
    .maybeSingle();

  return data?.activity_id || null;
}

async function enqueueCompletedLessonRefresh(input: {
  assistantMessageId: string
  client: ReturnType<typeof createSupabaseAdminClient>
  courseId: string | undefined
  enrollment: EnrollmentScopeRow | null
  lessonId: string | undefined
  organizationId: string | null
  userId: string
}): Promise<void> {
  if (
    !input.courseId ||
    !input.lessonId ||
    !input.enrollment ||
    !input.organizationId
  ) {
    return
  }

  const { data: progress } = await input.client
    .from('user_lesson_progress')
    .select('progress_id')
    .eq('user_id', input.userId)
    .eq('enrollment_id', input.enrollment.enrollment_id)
    .eq('lesson_id', input.lessonId)
    .eq('is_completed', true)
    .maybeSingle()
  if (!progress) return

  await enqueueLessonAutoNoteJob({
    client: input.client,
    courseId: input.courseId,
    enrollmentId: input.enrollment.enrollment_id,
    lessonId: input.lessonId,
    organizationId: input.organizationId,
    priority: 40,
    sourceVersion: input.assistantMessageId,
    userId: input.userId,
  })
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
  conversationId: string,
  userId?: string,
): Promise<string | null> {
  if (!isValidUUID(conversationId) || !userId) {
    return null;
  }

  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const { data: conversation, error: conversationError } = await supabaseAdmin
      .from('lia_conversations')
      .select('conversation_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .maybeSingle();

    if (conversationError || !conversation) {
      return null;
    }

    const { data, error } = await supabaseAdmin
      .from('lia_messages')
      .select('content')
      .eq('conversation_id', conversationId)
      .eq('role', 'assistant')
      .order('message_sequence', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      techDebtLogger.error(
        'Error obteniendo el ultimo mensaje del asistente de SofLIA:',
        error
      );
      return null;
    }

    return data?.content ?? null;
  } catch (error) {
    techDebtLogger.error(
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
}: PersistConversationTurnParams): Promise<PersistedConversationTurn | null> {
  if (
    !conversationId ||
    !userId ||
    !isValidUUID(conversationId) ||
    !userMessage ||
    userMessage.role !== 'user'
  ) {
    return null;
  }

  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const [enrollmentScope, activityId] = await Promise.all([
      resolveEnrollmentScope(supabaseAdmin, userId, requestContext),
      resolveActivityId(supabaseAdmin, requestContext),
    ]);

    const { data: existingConversation, error: existingConversationError } =
      await supabaseAdmin
        .from('lia_conversations')
        .select('user_id')
        .eq('conversation_id', conversationId)
        .maybeSingle();

    if (existingConversationError) {
      techDebtLogger.error(
        'Error verificando propiedad de conversacion de SofLIA:',
        existingConversationError,
      );
      return null;
    }
    if (existingConversation && existingConversation.user_id !== userId) {
      techDebtLogger.warn('Intento de reutilizar una conversacion de otro usuario', {
        conversationId,
        userId,
      });
      return null;
    }

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
          enrollment_id: enrollmentScope?.enrollment_id || null,
          activity_id: activityId,
          module_id: requestContext?.currentLessonContext?.moduleId || null,
          lesson_id: requestContext?.currentLessonContext?.lessonId || null,
          organization_id:
            typeof requestContext?.organizationId === 'string'
              ? requestContext.organizationId
              : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'conversation_id' }
      );

    if (upsertError) {
      techDebtLogger.error('Error en upsert de conversacion de SofLIA:', upsertError);
      return null;
    }

    const { data: lastMessageRecord, error: sequenceError } = await supabaseAdmin
      .from('lia_messages')
      .select('message_sequence')
      .eq('conversation_id', conversationId)
      .order('message_sequence', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sequenceError) {
      techDebtLogger.error(
        'Error obteniendo la secuencia de mensajes de SofLIA:',
        sequenceError
      );
      return null;
    }

    const nextSequence = (lastMessageRecord?.message_sequence || 0) + 1;

    const { data: persistedUserMessage, error: userMessageError } = await supabaseAdmin
      .from('lia_messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: userMessage.content,
        message_sequence: nextSequence,
      })
      .select('message_id')
      .single();

    if (userMessageError || !persistedUserMessage) {
      techDebtLogger.error(
        'Error guardando el mensaje del usuario en SofLIA:',
        userMessageError || new Error('Mensaje sin identificador')
      );
      return null;
    }

    const { data: persistedAssistantMessage, error: assistantMessageError } = await supabaseAdmin
      .from('lia_messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: assistantContent,
        model_used: await resolveLiaChatModel(),
        tokens_used: 0,
        message_sequence: nextSequence + 1,
      })
      .select('message_id')
      .single();

    if (assistantMessageError) {
      techDebtLogger.error(
        'Error guardando el mensaje del asistente en SofLIA:',
        assistantMessageError
      );
    }

    if (persistedAssistantMessage?.message_id) {
      try {
        await enqueueCompletedLessonRefresh({
          assistantMessageId: persistedAssistantMessage.message_id,
          client: supabaseAdmin,
          courseId: requestContext?.currentLessonContext?.courseId,
          enrollment: enrollmentScope,
          lessonId: requestContext?.currentLessonContext?.lessonId,
          organizationId: enrollmentScope?.organization_id || null,
          userId,
        })
      } catch (enqueueError) {
        techDebtLogger.warn('No se pudo refrescar el apunte tras el chat', {
          conversationId,
          error:
            enqueueError instanceof Error ? enqueueError.message : enqueueError,
        })
      }
    }

    return {
      assistantMessageId: persistedAssistantMessage?.message_id || null,
      conversationId,
      userMessageId: persistedUserMessage.message_id,
    };
  } catch (error) {
    techDebtLogger.error('Error persistiendo el turno de conversacion de SofLIA:', error);
    return null;
  }
}
