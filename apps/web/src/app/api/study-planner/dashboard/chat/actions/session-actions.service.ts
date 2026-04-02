/**
 * Session Actions Service
 * Handles study session CRUD operations: move, delete, resize, create, update.
 */

import { createAdminClient, syncSessionWithCalendar } from '../calendar.service';
import { getCurrentTimezone, getTimezoneOffset } from '../format.utils';
import { logger } from '../../../../../../lib/utils/logger';
import type { ActionResult } from '../types';

function hasTimezoneOffset(timestamp: string): boolean {
  return /[+-]\d{2}:\d{2}$/.test(timestamp) || timestamp.endsWith('Z');
}

export async function executeMoveSession(
  userId: string,
  _planId: string,
  action: ActionResult
): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { sessionId, newStartTime, newEndTime } = action.data;

  logger.info(`📅 Moviendo sesión ${sessionId} a ${newStartTime} - ${newEndTime}`);

  const tzOffset = getTimezoneOffset(getCurrentTimezone());
  const startTimeISO = hasTimezoneOffset(newStartTime) ? newStartTime : newStartTime + tzOffset;
  const endTimeISO = hasTimezoneOffset(newEndTime) ? newEndTime : newEndTime + tzOffset;

  logger.info(`📅 Timestamps ajustados: ${startTimeISO} -> ${endTimeISO}`);

  const calendarSync = await syncSessionWithCalendar(userId, sessionId, 'update', {
    start_time: startTimeISO,
    end_time: endTimeISO,
  });

  logger.info(`📅 Resultado sincronización calendario: ${JSON.stringify(calendarSync)}`);

  const { error } = await supabase
    .from('study_sessions')
    .update({
      start_time: startTimeISO,
      end_time: endTimeISO,
      was_rescheduled: true,
      rescheduled_from: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .eq('user_id', userId);

  if (error) {
    return { ...action, status: 'error', message: `Error al mover la sesión: ${error.message}` };
  }

  const calendarMsg = calendarSync.success ? ' y actualizada en tu calendario' : '';
  return { ...action, status: 'success', message: `✅ Sesión movida correctamente${calendarMsg}` };
}

export async function executeDeleteSession(
  userId: string,
  _planId: string,
  action: ActionResult
): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { sessionId } = action.data;

  const calendarSync = await syncSessionWithCalendar(userId, sessionId, 'delete');

  const { error } = await supabase
    .from('study_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', userId);

  if (error) {
    return { ...action, status: 'error', message: `Error al eliminar la sesión: ${error.message}` };
  }

  const calendarMsg = calendarSync.success ? ' y eliminada de tu calendario' : '';
  return { ...action, status: 'success', message: `✅ Sesión eliminada correctamente${calendarMsg}` };
}

export async function executeResizeSession(
  userId: string,
  _planId: string,
  action: ActionResult
): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { sessionId, newDurationMinutes } = action.data;

  const { data: session } = await supabase
    .from('study_sessions')
    .select('start_time')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single();

  if (!session) {
    return { ...action, status: 'error', message: 'Sesión no encontrada' };
  }

  const startTime = new Date(session.start_time);
  const newEndTime = new Date(startTime.getTime() + newDurationMinutes * 60 * 1000);

  const calendarSync = await syncSessionWithCalendar(userId, sessionId, 'update', {
    start_time: session.start_time,
    end_time: newEndTime.toISOString(),
  });

  const { error } = await supabase
    .from('study_sessions')
    .update({
      end_time: newEndTime.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .eq('user_id', userId);

  if (error) {
    return { ...action, status: 'error', message: `Error al ajustar duración: ${error.message}` };
  }

  const calendarMsg = calendarSync.success ? ' y actualizada en tu calendario' : '';
  return { ...action, status: 'success', message: `✅ Duración ajustada a ${newDurationMinutes} minutos${calendarMsg}` };
}

export async function executeCreateSession(
  userId: string,
  planId: string,
  action: ActionResult
): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { title, startTime, endTime, courseId, lessonId, description } = action.data;

  const { error } = await supabase
    .from('study_sessions')
    .insert({
      plan_id: planId,
      user_id: userId,
      title,
      description,
      start_time: startTime,
      end_time: endTime,
      course_id: courseId,
      lesson_id: lessonId,
      status: 'planned',
      is_ai_generated: false,
    });

  if (error) {
    return { ...action, status: 'error', message: `Error al crear sesión: ${error.message}` };
  }
  return { ...action, status: 'success', message: '✅ Nueva sesión creada correctamente' };
}

export async function executeUpdateSession(
  userId: string,
  _planId: string,
  action: ActionResult
): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { sessionId, ...updates } = action.data;

  const { error } = await supabase
    .from('study_sessions')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .eq('user_id', userId);

  if (error) {
    return { ...action, status: 'error', message: `Error al actualizar sesión: ${error.message}` };
  }
  return { ...action, status: 'success', message: '✅ Sesión actualizada correctamente' };
}
