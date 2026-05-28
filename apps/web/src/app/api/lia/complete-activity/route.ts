import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import type { Json } from '@/lib/supabase/types';
import { createAdminClient } from '../../../../lib/supabase/admin';
import { SessionService } from '../../../../features/auth/services/session.service';
import { resolveActivityCompletionAttempt } from './activity-completion-attempts.service';
import {
  completeActivitySchema,
  type CompleteActivityBody,
} from '../_schemas';

type CompletionStatus = 'completed';

interface ActivityCompletionRecord {
  activity_id?: string;
  completion_id: string;
  conversation_id?: string | null;
  organization_id?: string | null;
  started_at: string | null;
  total_steps: number | null;
  status?: string;
}

interface ActivityCompletionUpdate {
  status: CompletionStatus;
  completed_steps: number;
  completed_at: string;
  time_to_complete_seconds: number;
  generated_output: Json | null;
  updated_at: string;
}

interface ActivityCompletionInsert extends ActivityCompletionUpdate {
  conversation_id: string | null;
  user_id: string;
  activity_id: string;
  attempts_to_complete: number;
  total_steps: number;
  current_step: number;
  lia_had_to_redirect: number;
  started_at: string;
}

interface CompletedActivityContext {
  activityId: string;
  activityTitle: string;
  courseId: string;
  courseSlug: string | null;
  courseTitle: string;
  lessonId: string;
  organizationId: string | null;
}

function toNullableJson(value: unknown): Json | null {
  if (value === undefined) {
    return null;
  }

  return value as Json;
}

async function hasUserMessageInConversation(input: {
  activityId: string;
  conversationId?: string | null;
  supabase: ReturnType<typeof createAdminClient>;
  userId: string;
}) {
  if (!input.conversationId) {
    return false;
  }

  const { data: conversation, error: conversationError } = await input.supabase
    .from('lia_conversations')
    .select('conversation_id')
    .eq('conversation_id', input.conversationId)
    .eq('user_id', input.userId)
    .eq('activity_id', input.activityId)
    .maybeSingle();

  if (conversationError) {
    techDebtLogger.error('Error validating LIA conversation ownership:', conversationError);
    return false;
  }

  if (!conversation) {
    return false;
  }

  const { count, error } = await input.supabase
    .from('lia_messages')
    .select('message_id', { count: 'exact', head: true })
    .eq('conversation_id', input.conversationId)
    .eq('role', 'user');

  if (error) {
    techDebtLogger.error('Error validating LIA user message:', error);
    return false;
  }

  return (count || 0) > 0;
}

function firstRow<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

async function resolveCompletedActivityContext(input: {
  activityId: string;
  conversationId?: string | null;
  organizationId?: string | null;
  supabase: ReturnType<typeof createAdminClient>;
  userId: string;
}): Promise<CompletedActivityContext | null> {
  const { data: activity } = await input.supabase
    .from('lesson_activities')
    .select('activity_id, activity_title, lesson_id')
    .eq('activity_id', input.activityId)
    .maybeSingle();

  if (!activity?.lesson_id) {
    return null;
  }

  const { data: lesson } = await input.supabase
    .from('course_lessons')
    .select('lesson_id, module_id')
    .eq('lesson_id', activity.lesson_id)
    .maybeSingle();

  if (!lesson?.module_id) {
    return null;
  }

  const { data: module } = await input.supabase
    .from('course_modules')
    .select('course_id')
    .eq('module_id', lesson.module_id)
    .maybeSingle();

  if (!module?.course_id) {
    return null;
  }

  const [{ data: course }, { data: conversation }, { data: enrollment }] =
    await Promise.all([
      input.supabase
        .from('courses')
        .select('id, title, slug')
        .eq('id', module.course_id)
        .maybeSingle(),
      input.conversationId
        ? input.supabase
            .from('lia_conversations')
            .select('organization_id')
            .eq('conversation_id', input.conversationId)
            .eq('user_id', input.userId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      input.supabase
        .from('user_course_enrollments')
        .select('organization_id')
        .eq('user_id', input.userId)
        .eq('course_id', module.course_id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  if (!course?.id) {
    return null;
  }

  return {
    activityId: activity.activity_id,
    activityTitle: activity.activity_title || 'Actividad',
    courseId: course.id,
    courseSlug: course.slug || null,
    courseTitle: course.title || 'Curso',
    lessonId: activity.lesson_id,
    organizationId:
      input.organizationId ||
      firstRow(conversation)?.organization_id ||
      firstRow(enrollment)?.organization_id ||
      null,
  };
}

async function notifyLiaActivityCompletedBestEffort(input: {
  activityId: string;
  completionId?: string | null;
  conversationId?: string | null;
  organizationId?: string | null;
  supabase: ReturnType<typeof createAdminClient>;
  userId: string;
}) {
  try {
    const context = await resolveCompletedActivityContext(input);
    if (!context) {
      return;
    }

    const { AutoNotificationsService } = await import(
      '@/features/notifications/services/auto-notifications.service'
    );

    await AutoNotificationsService.notifyCourseActivityCompleted(
      input.userId,
      context.courseId,
      context.courseTitle,
      context.lessonId,
      context.activityId,
      context.activityTitle,
      {
        action_url: context.courseSlug ? `/courses/${context.courseSlug}/learn` : undefined,
        completion_id: input.completionId || undefined,
        conversation_id: input.conversationId || undefined,
        courseSlug: context.courseSlug || undefined,
        organization_id: context.organizationId || undefined,
        source: 'lia_activity_completion',
      },
    );
  } catch (error) {
    techDebtLogger.warn('No se pudo crear notificacion de actividad LIA completada:', error);
  }
}

/**
 * POST /api/lia/complete-activity
 * 
 * Marca una actividad como completada y guarda el output generado
 * Puede recibir completionId (para actualizar) o crear una nueva actividad completada directamente
 */
async function handlePost(
  _request: NextRequest,
  body: CompleteActivityBody,
  _context: unknown,
) {
  try {
    // ✅ Usar SessionService para autenticación
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return apiError('UNAUTHORIZED', 'No autorizado', 401);
    }

    // Obtener datos del body
    const { 
      completionId, 
      conversationId,
      activityType,
      generatedOutput,
      requireUserMessage = false,
      timeSpentSeconds 
    } = body;

    // Cliente con service-role: la auth del proyecto es legacy session (no Supabase Auth),
    // por lo que el cliente anon no expone auth.uid() y RLS bloquea las escrituras.
    // La identidad ya fue validada arriba con SessionService; siempre escribimos con user.id
    // y filtramos por user_id en lecturas/updates para preservar ownership.
    const supabase = createAdminClient();

    // Si hay completionId, actualizar el registro existente (solo si pertenece al usuario)
    if (completionId) {
      const { data: activity, error: fetchError } = await supabase
        .from('lia_activity_completions')
        .select('activity_id, conversation_id, organization_id, started_at, status, total_steps')
        .eq('completion_id', completionId)
        .eq('user_id', user.id)
        .single<ActivityCompletionRecord>();

      if (fetchError || !activity) {
        return apiError('ACTIVITY_NOT_FOUND', 'Actividad no encontrada', 404);
      }

      let timeToComplete = timeSpentSeconds;
      if (!timeToComplete && activity?.started_at) {
        timeToComplete = Math.floor(
          (new Date().getTime() - new Date(activity.started_at).getTime()) / 1000
        );
      }

      const updateData: ActivityCompletionUpdate = {
        status: 'completed',
        completed_steps: activity?.total_steps || 1,
        completed_at: new Date().toISOString(),
        time_to_complete_seconds: timeToComplete || 0,
        generated_output: toNullableJson(generatedOutput),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('lia_activity_completions')
        .update(updateData)
        .eq('completion_id', completionId)
        .eq('user_id', user.id);

      if (error) {
        techDebtLogger.error('Error completing activity:', error);
        return apiError(
          'ACTIVITY_COMPLETION_FAILED',
          'Error al completar actividad',
          500,
        );
      }

      if (activity.status !== 'completed' && activity.activity_id) {
        await notifyLiaActivityCompletedBestEffort({
          activityId: activity.activity_id,
          completionId,
          conversationId: activity.conversation_id || conversationId,
          organizationId: activity.organization_id,
          supabase,
          userId: user.id,
        });
      }

      return NextResponse.json({
        success: true,
        completionId,
        completed: true,
      });
    }

    // Si no hay completionId, crear una nueva actividad completada directamente
    if (!activityType) {
      return apiError(
        'ACTIVITY_TYPE_REQUIRED',
        'activityType o completionId es requerido',
        400,
      );
    }

    if (requireUserMessage) {
      const hasUserMessage = await hasUserMessageInConversation({
        activityId: activityType,
        conversationId,
        supabase,
        userId: user.id,
      });

      if (!hasUserMessage) {
        return apiError(
          'ACTIVITY_USER_MESSAGE_REQUIRED',
          'La actividad requiere al menos un mensaje real del usuario',
          409,
        );
      }
    }

    const { data: existingCompletions, error: completionLookupError } =
      await supabase
        .from('lia_activity_completions')
        .select('completion_id, status, started_at, total_steps, activity_id')
        .eq('user_id', user.id)
        .eq('activity_id', activityType)
        .order('started_at', { ascending: true });

    if (completionLookupError) {
      techDebtLogger.error('Error counting activity attempts:', completionLookupError);
      return apiError(
        'ACTIVITY_ATTEMPTS_VALIDATION_FAILED',
        'Error al validar intentos de actividad',
        500,
      );
    }

    const completionRows = (existingCompletions || []) as ActivityCompletionRecord[];
    const attemptDecision = resolveActivityCompletionAttempt(completionRows);

    if (attemptDecision.kind === 'already_completed') {
      return NextResponse.json({
        success: true,
        completionId: attemptDecision.completionId,
        completed: true,
      });
    }

    if (attemptDecision.kind === 'limit_reached') {
      return apiError(
        'ACTIVITY_ATTEMPT_LIMIT_REACHED',
        'Se alcanzo el limite de 3 intentos para esta actividad',
        409,
      );
    }

    const insertData: ActivityCompletionInsert = {
      conversation_id: conversationId || null,
      user_id: user.id,
      activity_id: activityType,
      attempts_to_complete: attemptDecision.attemptNumber,
      status: 'completed',
      total_steps: 1,
      completed_steps: 1,
      current_step: 1,
      time_to_complete_seconds: timeSpentSeconds || 0,
      lia_had_to_redirect: 0,
      generated_output: toNullableJson(generatedOutput),
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('lia_activity_completions')
      .insert(insertData)
      .select('completion_id')
      .single<Pick<ActivityCompletionRecord, 'completion_id'>>();

    if (error) {
      techDebtLogger.error('Error creating completed activity:', error);

      if (error.message?.includes('limite de 3 intentos')) {
        return apiError(
          'ACTIVITY_ATTEMPT_LIMIT_REACHED',
          'Se alcanzo el limite de 3 intentos para esta actividad',
          409,
        );
      }

      return apiError(
        'ACTIVITY_COMPLETION_REGISTRATION_FAILED',
        'Error al registrar actividad completada',
        500,
      );
    }

    if (data?.completion_id) {
      await notifyLiaActivityCompletedBestEffort({
        activityId: activityType,
        completionId: data.completion_id,
        conversationId,
        supabase,
        userId: user.id,
      });
    }

    return NextResponse.json({
      success: true,
      completionId: data?.completion_id,
      completed: true,
    });
  } catch (error) {
    techDebtLogger.error('Error completing activity:', error);
    return apiError(
      'ACTIVITY_COMPLETION_FAILED',
      'Error al completar actividad',
      500,
    );
  }
}

export const POST = withZodBody(completeActivitySchema, handlePost);
