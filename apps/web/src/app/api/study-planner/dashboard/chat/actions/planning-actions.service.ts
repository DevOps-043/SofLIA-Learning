/**
 * Planning Actions Service
 * Handles proactive optimization actions: micro-sessions, recover missed,
 * rebalance plan, reduce load, and calendar selection updates.
 */

import { createAdminClient, syncSessionWithCalendar, getCalendarAccessToken, createGoogleCalendarEvent, deleteGoogleCalendarEvent } from '../calendar.service';
import { getCurrentTimezone } from '../format.utils';
import { CalendarIntegrationService } from '../../../../../../features/study-planner/services/calendar-integration.service';
import { logger } from '../../../../../../lib/utils/logger';
import type { ActionResult } from '../types';

// Fixed offset used for automatic slot assignment in rebalance_plan
const DEFAULT_TZ_OFFSET = '-06:00';

export async function executeCreateMicroSession(
  userId: string,
  planId: string,
  action: ActionResult
): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { title, startTime, endTime, type } = action.data;

  const start = new Date(startTime);
  const end = new Date(endTime);
  const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));

  if (durationMinutes > 45) {
    return { ...action, status: 'error', message: '❌ Las micro-sesiones deben ser de máximo 45 minutos.' };
  }

  const sessionTitle = title || `📝 ${type || 'Micro-sesión de repaso'}`;

  const { data: session, error } = await supabase
    .from('study_sessions')
    .insert({
      user_id: userId,
      plan_id: planId,
      title: sessionTitle,
      description: `Micro-sesión de ${type || 'repaso rápido'} (${durationMinutes} min)`,
      start_time: startTime,
      end_time: endTime,
      duration_minutes: durationMinutes,
      status: 'planned',
    })
    .select()
    .single();

  if (error) {
    logger.error('Error creando micro-sesión:', error);
    return { ...action, status: 'error', message: '❌ Error al crear la micro-sesión.' };
  }

  const { accessToken, provider, calendarId } = await getCalendarAccessToken(userId);
  if (accessToken && provider === 'google') {
    const eventId = await createGoogleCalendarEvent(
      accessToken,
      {
        title: sessionTitle,
        start_time: startTime,
        end_time: endTime,
        description: session.description || '',
      },
      getCurrentTimezone() || 'America/Mexico_City',
      calendarId
    );

    if (eventId) {
      await supabase
        .from('study_sessions')
        .update({ external_event_id: eventId })
        .eq('id', session.id);
    }
  }

  return {
    ...action,
    status: 'success',
    message: `✅ Micro-sesión de ${durationMinutes} minutos creada: "${sessionTitle}"`,
    data: { sessionId: session.id },
  };
}

export async function executeRecoverMissedSession(
  userId: string,
  _planId: string,
  action: ActionResult
): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { sessionId, newStartTime, newEndTime } = action.data;

  const { data: originalSession, error: getError } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (getError || !originalSession) {
    return { ...action, status: 'error', message: '❌ Sesión no encontrada.' };
  }

  const start = new Date(newStartTime);
  const end = new Date(newEndTime);
  const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));

  const { error: updateError } = await supabase
    .from('study_sessions')
    .update({
      start_time: newStartTime,
      end_time: newEndTime,
      duration_minutes: durationMinutes,
      status: 'planned',
    })
    .eq('id', sessionId);

  if (updateError) {
    logger.error('Error recuperando sesión:', updateError);
    return { ...action, status: 'error', message: '❌ Error al reprogramar la sesión.' };
  }

  if (originalSession.external_event_id) {
    await syncSessionWithCalendar(userId, sessionId, 'update', {
      start_time: newStartTime,
      end_time: newEndTime,
    });
  } else {
    const { accessToken, provider, calendarId } = await getCalendarAccessToken(userId);
    if (accessToken && provider === 'google') {
      const eventId = await createGoogleCalendarEvent(
        accessToken,
        {
          title: originalSession.title,
          start_time: newStartTime,
          end_time: newEndTime,
          description: originalSession.description || '',
        },
        getCurrentTimezone() || 'America/Mexico_City',
        calendarId
      );

      if (eventId) {
        await supabase
          .from('study_sessions')
          .update({ external_event_id: eventId })
          .eq('id', sessionId);
      }
    }
  }

  return {
    ...action,
    status: 'success',
    message: `✅ Sesión "${originalSession.title}" reprogramada exitosamente.`,
    data: { sessionId },
  };
}

export async function executeRebalancePlan(
  userId: string,
  planId: string,
  action: ActionResult
): Promise<ActionResult> {
  const supabase = createAdminClient();
  let { sessionsToMove } = action.data || {};

  if (!sessionsToMove || !Array.isArray(sessionsToMove) || sessionsToMove.length === 0) {
    logger.info('📋 REBALANCE_PLAN - Calculando sesiones automáticamente...');

    const now = new Date();
    const { data: overdueSessions, error: fetchError } = await supabase
      .from('study_sessions')
      .select('id, title, start_time, end_time, duration_minutes')
      .eq('plan_id', planId)
      .eq('status', 'planned')
      .lt('end_time', now.toISOString())
      .order('start_time', { ascending: true });

    if (fetchError || !overdueSessions || overdueSessions.length === 0) {
      return {
        ...action,
        status: 'error',
        message: '❌ No se encontraron sesiones pendientes para redistribuir.',
      };
    }

    logger.info(`📋 Encontradas ${overdueSessions.length} sesiones overdue para redistribuir`);

    const preferredHours = [8, 9, 10, 17, 18, 19, 20];
    sessionsToMove = [];
    let dayOffset = 0;
    let hourIndex = 0;

    const formatWithTZ = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const mins = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${mins}:00${DEFAULT_TZ_OFFSET}`;
    };

    for (const session of overdueSessions) {
      let foundSlot = false;
      while (!foundSlot && dayOffset < 14) {
        const targetDate = new Date(now);
        targetDate.setDate(targetDate.getDate() + dayOffset);
        targetDate.setHours(preferredHours[hourIndex], 0, 0, 0);

        if (targetDate > now) {
          const duration = session.duration_minutes || 30;
          const endDate = new Date(targetDate.getTime() + duration * 60 * 1000);

          sessionsToMove.push({
            sessionId: session.id,
            newStartTime: formatWithTZ(targetDate),
            newEndTime: formatWithTZ(endDate),
          });

          foundSlot = true;
        }

        hourIndex++;
        if (hourIndex >= preferredHours.length) {
          hourIndex = 0;
          dayOffset++;
        }
      }
    }

    if (sessionsToMove.length === 0) {
      return {
        ...action,
        status: 'error',
        message: '❌ No se pudieron calcular nuevos horarios para las sesiones.',
      };
    }
  }

  logger.info(`📋 REBALANCE_PLAN - Sesiones a mover: ${JSON.stringify(sessionsToMove)}`);

  const results: Array<{ sessionId: string; success: boolean }> = [];

  for (const sessionMove of sessionsToMove) {
    const { sessionId: moveSessionId, newStartTime, newEndTime } = sessionMove;

    logger.info(`🔄 Moviendo sesión ${moveSessionId}: ${newStartTime} -> ${newEndTime}`);

    let startTimeISO = newStartTime;
    let endTimeISO = newEndTime;

    if (!newStartTime.includes('+') && !newStartTime.includes('Z') && !newStartTime.match(/-\d{2}:\d{2}$/)) {
      startTimeISO = newStartTime + DEFAULT_TZ_OFFSET;
    }
    if (!newEndTime.includes('+') && !newEndTime.includes('Z') && !newEndTime.match(/-\d{2}:\d{2}$/)) {
      endTimeISO = newEndTime + DEFAULT_TZ_OFFSET;
    }

    logger.info(`📅 Timestamps ajustados: ${startTimeISO} -> ${endTimeISO}`);

    const start = new Date(startTimeISO);
    const end = new Date(endTimeISO);
    const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));

    const { error } = await supabase
      .from('study_sessions')
      .update({
        start_time: startTimeISO,
        end_time: endTimeISO,
        duration_minutes: durationMinutes,
      })
      .eq('id', moveSessionId);

    if (!error) {
      results.push({ sessionId: moveSessionId, success: true });
      await syncSessionWithCalendar(userId, moveSessionId, 'update', {
        start_time: startTimeISO,
        end_time: endTimeISO,
      });
    } else {
      logger.error(`❌ Error moviendo sesión ${moveSessionId}: ${error.message}`);
      results.push({ sessionId: moveSessionId, success: false });
    }
  }

  const successCount = results.filter((r) => r.success).length;

  return {
    ...action,
    status: successCount > 0 ? 'success' : 'error',
    message:
      successCount > 0
        ? `✅ Plan rebalanceado: ${successCount}/${sessionsToMove.length} sesiones reprogramadas.`
        : '❌ No se pudieron reprogramar las sesiones.',
    data: { results, sessionsRebalanced: successCount },
  };
}

export async function executeReduceSessionLoad(
  userId: string,
  _planId: string,
  action: ActionResult
): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { date, sessionsToReduce } = action.data;

  if (!sessionsToReduce || !Array.isArray(sessionsToReduce) || sessionsToReduce.length === 0) {
    return { ...action, status: 'error', message: '❌ No se especificaron sesiones para reducir.' };
  }

  const reduceResults: Array<{ sessionId: string; action: string; success: boolean }> = [];
  const { accessToken, provider, calendarId } = await getCalendarAccessToken(userId);

  for (const sessionAction of sessionsToReduce) {
    const { sessionId: reduceSessionId, reduceAction, newData } = sessionAction;

    if (reduceAction === 'delete') {
      const { data: session } = await supabase
        .from('study_sessions')
        .select('external_event_id')
        .eq('id', reduceSessionId)
        .single();

      const { error } = await supabase
        .from('study_sessions')
        .delete()
        .eq('id', reduceSessionId);

      if (!error) {
        reduceResults.push({ sessionId: reduceSessionId, action: 'deleted', success: true });
        if (accessToken && provider === 'google' && session?.external_event_id) {
          await deleteGoogleCalendarEvent(accessToken, session.external_event_id, calendarId);
        }
      } else {
        reduceResults.push({ sessionId: reduceSessionId, action: 'deleted', success: false });
      }
    } else if (reduceAction === 'resize' && newData?.durationMinutes) {
      const { data: session } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('id', reduceSessionId)
        .single();

      if (session) {
        const startTime = new Date(session.start_time);
        const newEndTime = new Date(startTime.getTime() + newData.durationMinutes * 60 * 1000);

        const { error } = await supabase
          .from('study_sessions')
          .update({
            end_time: newEndTime.toISOString(),
            duration_minutes: newData.durationMinutes,
          })
          .eq('id', reduceSessionId);

        if (!error) {
          reduceResults.push({ sessionId: reduceSessionId, action: 'resized', success: true });
          await syncSessionWithCalendar(userId, reduceSessionId, 'update', {
            start_time: session.start_time,
            end_time: newEndTime.toISOString(),
          });
        } else {
          reduceResults.push({ sessionId: reduceSessionId, action: 'resized', success: false });
        }
      }
    } else if (reduceAction === 'move' && newData?.startTime && newData?.endTime) {
      const start = new Date(newData.startTime);
      const end = new Date(newData.endTime);
      const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));

      const { error } = await supabase
        .from('study_sessions')
        .update({
          start_time: newData.startTime,
          end_time: newData.endTime,
          duration_minutes: durationMinutes,
        })
        .eq('id', reduceSessionId);

      if (!error) {
        reduceResults.push({ sessionId: reduceSessionId, action: 'moved', success: true });
        await syncSessionWithCalendar(userId, reduceSessionId, 'update', {
          start_time: newData.startTime,
          end_time: newData.endTime,
        });
      } else {
        reduceResults.push({ sessionId: reduceSessionId, action: 'moved', success: false });
      }
    }
  }

  const reduceSuccessCount = reduceResults.filter((r) => r.success).length;

  return {
    ...action,
    status: reduceSuccessCount > 0 ? 'success' : 'error',
    message: `✅ Carga del ${date} reducida: ${reduceSuccessCount}/${sessionsToReduce.length} cambios aplicados.`,
    data: { results: reduceResults },
  };
}

export async function executeUpdateCalendarSelection(
  userId: string,
  _planId: string,
  action: ActionResult
): Promise<ActionResult> {
  const { selectedCalendarIds } = action.data || {};

  if (!selectedCalendarIds || !Array.isArray(selectedCalendarIds) || selectedCalendarIds.length === 0) {
    return { ...action, status: 'error', message: 'Debes seleccionar al menos un calendario.' };
  }

  logger.info(`📅 Actualizando selección de calendarios: ${selectedCalendarIds.join(', ')}`);

  try {
    await CalendarIntegrationService.saveSelectedCalendarIds(userId, selectedCalendarIds);
    const count = selectedCalendarIds.length;
    return {
      ...action,
      status: 'success',
      message: `✅ Selección de calendarios actualizada (${count} calendario${count > 1 ? 's' : ''} seleccionado${count > 1 ? 's' : ''}).`,
    };
  } catch (calError: unknown) {
    logger.error('❌ Error actualizando selección de calendarios:', calError);
    const msg = calError instanceof Error ? calError.message : 'Error desconocido';
    return { ...action, status: 'error', message: `Error al actualizar calendarios: ${msg}` };
  }
}
