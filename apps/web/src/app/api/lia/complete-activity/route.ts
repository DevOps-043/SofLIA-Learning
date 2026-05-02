import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '../../../../lib/supabase/admin';
import { SessionService } from '../../../../features/auth/services/session.service';

type CompletionStatus = 'completed';

interface CompleteActivityRequest {
  completionId?: string;
  conversationId?: string | null;
  activityType?: string;
  generatedOutput?: unknown;
  timeSpentSeconds?: number;
}

interface ActivityCompletionRecord {
  completion_id: string;
  started_at: string | null;
  total_steps: number | null;
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
  total_steps: number;
  current_step: number;
  lia_had_to_redirect: number;
  started_at: string;
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
        console.error('Error completing activity:', error);
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

    const insertData: ActivityCompletionInsert = {
      conversation_id: conversationId || null,
      user_id: user.id,
      activity_id: activityType,
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
      console.error('Error creating completed activity:', error);
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
    console.error('Error completing activity:', error);
    return NextResponse.json(
      { error: 'Error al completar actividad' },
      { status: 500 }
    );
  }
}
