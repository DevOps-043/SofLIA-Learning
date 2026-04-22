import { createAdminClient, syncSessionWithCalendar } from '../calendar.service';
import type { ActionResult } from '../types';
import { validateStrictLessonOrder } from './lesson-order-guardrails.service';
import { validatePlacementAgainstCalendarRules } from './scheduling-guardrails.service';

export async function executeUpdateSessionV2(
  userId: string,
  planId: string,
  action: ActionResult,
  userMessage?: string,
): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { sessionId, ...updates } = action.data as { sessionId: string };
  let calendarStartTime: string | undefined;
  let calendarEndTime: string | undefined;

  const startTimeCandidate = typeof updates.start_time === 'string'
    ? updates.start_time
    : typeof (updates as { startTime?: string }).startTime === 'string'
      ? (updates as { startTime?: string }).startTime
      : undefined;
  const endTimeCandidate = typeof updates.end_time === 'string'
    ? updates.end_time
    : typeof (updates as { endTime?: string }).endTime === 'string'
      ? (updates as { endTime?: string }).endTime
      : undefined;

  if (startTimeCandidate || endTimeCandidate) {
    const { data: existingSession } = await supabase
      .from('study_sessions')
      .select('start_time, end_time')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (!existingSession) {
      return { ...action, status: 'error', message: 'Sesion no encontrada' };
    }

    const nextStartTime = startTimeCandidate || existingSession.start_time;
    const nextEndTime = endTimeCandidate || existingSession.end_time;
    calendarStartTime = nextStartTime;
    calendarEndTime = nextEndTime;
    const placementValidation = await validatePlacementAgainstCalendarRules({
      userId,
      sessionId,
      startTimeIso: nextStartTime,
      endTimeIso: nextEndTime,
      userMessage,
    });

    if (!placementValidation.valid) {
      return { ...action, status: 'error', message: placementValidation.message };
    }

    const orderValidation = await validateStrictLessonOrder({
      userId,
      planId,
      proposedMoves: [{ sessionId, newStartTime: nextStartTime }],
    });

    if (!orderValidation.valid) {
      return {
        ...action,
        status: 'error',
        code: orderValidation.code,
        message: orderValidation.message,
      };
    }
  }

  const { error } = await supabase
    .from('study_sessions')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .eq('user_id', userId);

  if (error) {
    return { ...action, status: 'error', message: `Error al actualizar sesion: ${error.message}` };
  }

  if (startTimeCandidate || endTimeCandidate) {
    await syncSessionWithCalendar(userId, sessionId, 'update', {
      start_time: calendarStartTime,
      end_time: calendarEndTime,
    });
  }

  return { ...action, status: 'success', message: 'Sesion actualizada correctamente' };
}
