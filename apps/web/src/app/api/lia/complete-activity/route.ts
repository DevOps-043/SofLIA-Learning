import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '../../../../lib/supabase/admin';
import { SessionService } from '../../../../features/auth/services/session.service';
import { resolveActivityCompletionAttempt } from './activity-completion-attempts.service';

type CompletionStatus = 'completed';

interface CompleteActivityRequest {
  completionId?: string;
  conversationId?: string | null;
  activityType?: string;
  generatedOutput?: unknown;
  requireUserMessage?: boolean;
  timeSpentSeconds?: number;
}

interface ActivityCompletionRecord {
  activity_id?: string;
  completion_id: string;
  started_at: string | null;
  total_steps: number | null;
  status?: string;
}

interface ActivityCompletionUpdate {
  status: CompletionStatus;
  completed_steps: number;
  completed_at: string;
  time_to_complete_seconds: number;
  generated_output: unknown;
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

/**
 * POST /api/lia/complete-activity
 * 
 * Marca una actividad como completada y guarda el output generado
 * Puede recibir completionId (para actualizar) o crear una nueva actividad completada directamente
 */
export async function POST(request: NextRequest) {
  try {
    // ✅ Usar SessionService para autenticación
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener datos del body
    const { 
      completionId, 
      conversationId,
      activityType,
      generatedOutput,
      requireUserMessage = false,
      timeSpentSeconds 
    }: CompleteActivityRequest = await request.json();

    // Cliente con service-role: la auth del proyecto es legacy session (no Supabase Auth),
    // por lo que el cliente anon no expone auth.uid() y RLS bloquea las escrituras.
    // La identidad ya fue validada arriba con SessionService; siempre escribimos con user.id
    // y filtramos por user_id en lecturas/updates para preservar ownership.
    const supabase = createAdminClient();

    // Si hay completionId, actualizar el registro existente (solo si pertenece al usuario)
    if (completionId) {
      const { data: activity, error: fetchError } = await supabase
        .from('lia_activity_completions')
        .select('started_at, total_steps')
        .eq('completion_id', completionId)
        .eq('user_id', user.id)
        .single<ActivityCompletionRecord>();

      if (fetchError || !activity) {
        return NextResponse.json(
          { error: 'Actividad no encontrada' },
          { status: 404 }
        );
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
        generated_output: generatedOutput || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('lia_activity_completions')
        .update(updateData)
        .eq('completion_id', completionId)
        .eq('user_id', user.id);

      if (error) {
        techDebtLogger.error('Error completing activity:', error);
        return NextResponse.json(
          { error: 'Error al completar actividad' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        completionId,
        completed: true,
      });
    }

    // Si no hay completionId, crear una nueva actividad completada directamente
    if (!activityType) {
      return NextResponse.json(
        { error: 'activityType o completionId es requerido' },
        { status: 400 }
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
        return NextResponse.json(
          { error: 'La actividad requiere al menos un mensaje real del usuario' },
          { status: 409 }
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
      return NextResponse.json(
        { error: 'Error al validar intentos de actividad' },
        { status: 500 }
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
      return NextResponse.json(
        { error: 'Se alcanzo el limite de 3 intentos para esta actividad' },
        { status: 409 }
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
      generated_output: generatedOutput || null,
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
        return NextResponse.json(
          { error: 'Se alcanzo el limite de 3 intentos para esta actividad' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Error al registrar actividad completada' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      completionId: data?.completion_id,
      completed: true,
    });
  } catch (error) {
    techDebtLogger.error('Error completing activity:', error);
    return NextResponse.json(
      { error: 'Error al completar actividad' },
      { status: 500 }
    );
  }
}
