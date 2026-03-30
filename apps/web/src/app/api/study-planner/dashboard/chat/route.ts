/**
 * API Endpoint: Study Planner Dashboard Chat
 * POST /api/study-planner/dashboard/chat
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { SessionService } from '../../../../../features/auth/services/session.service';
import { logger } from '../../../../../lib/utils/logger';
import { SofLIALogger } from '../../../../../lib/analytics/lia-logger';
import { calculateCost, logOpenAIUsage } from '../../../../../lib/openai/usage-monitor';
import { createAdminClient, syncSessionWithCalendar, updateGoogleCalendarEvent, deleteGoogleCalendarEvent, createGoogleCalendarEvent, listGoogleCalendarEvents, moveGoogleCalendarEvent, getCalendarAccessToken, refreshAccessToken } from './calendar.service';
import { getPlanContext } from './context.service';
import { setCurrentTimezone, getCurrentTimezone, getTimezoneOffset } from './format.utils';
import { findAlternativeSlots } from './analysis.service';
import type { ActionType, ActionResult, ChatRequest, ChatResponse } from './types';

// Instrucciones base mínimas para LIA (sin prompt maestro gigante)
const BASE_LIA_INSTRUCTION = `Eres LIA, coach inteligente de estudios.
TU OBJETIVO: Maximizar el cumplimiento del plan de estudios del usuario.
TU SUPERPODER: Proactividad. No esperes a que te pregunten. Si ves un problema, propón una solución.

ACCIONES DISPONIBLES (usa tags <action>JSON</action>):
- rebalance_plan: Redistribuir sesiones atrasadas en la semana
- move_session: Mover una sesión a otro horario
- delete_session: Eliminar una sesión
- create_session: Crear nueva sesión
- recover_missed_session: Reprogramar sesión perdida
- reduce_session_load: Reducir carga de un día
- update_calendar_selection: Cambiar qué calendarios se consideran para disponibilidad

FORMATO OBLIGATORIO DE ACCIÓN (siempre incluir "type" y "data"):
<action>{"type": "rebalance_plan", "data": {}}</action>
<action>{"type": "move_session", "data": {"sessionId": "uuid", "newStartTime": "ISO", "newEndTime": "ISO"}}</action>
<action>{"type": "update_calendar_selection", "data": {"selectedCalendarIds": ["id1", "id2"]}}</action>

REGLAS DE ORO:
1. SIEMPRE incluir "type" en el JSON de la acción
2. Si no hay acción, NO uses el tag <action>
3. Si hay conflictos de horario: ¡AVISA Y PROPÓN CAMBIO!
4. Si hay sesiones perdidas: Pregunta si quiere reprogramar
5. Sé breve, directa y útil. Cero charla vacía
6. Usa Markdown (negritas) para datos clave
7. NO uses emojis
`;
function extractAction(response: string): { action: ActionResult | null; actions: ActionResult[]; cleanResponse: string } {
  logger.info(`🔍 Buscando tag(s) <action> en respuesta...`);
  logger.info(`📝 Respuesta recibida (primeros 500 chars): ${response.substring(0, 500)}`);

  // Buscar todas las acciones (soporte para múltiples)
  const actionMatches = response.matchAll(/<action>([\s\S]*?)<\/action>/g);
  const actions: ActionResult[] = [];

  for (const actionMatch of actionMatches) {
    try {
      const rawJson = actionMatch[1].trim();
      logger.info(`📋 JSON raw encontrado: ${rawJson.substring(0, 200)}`);

      const actionData = JSON.parse(rawJson);

      // VALIDAR que type existe y no es undefined
      if (!actionData.type) {
        logger.warn(`⚠️ Action sin type válido, ignorando: ${JSON.stringify(actionData).substring(0, 200)}`);
        continue; // Saltar esta acción inválida
      }

      const normalizedType = actionData.type.toLowerCase();
      logger.info(`✅ Acción encontrada: type=${normalizedType}, data=${JSON.stringify(actionData.data || {}).substring(0, 200)}`);

      actions.push({
        type: normalizedType as ActionType,
        data: actionData.data || {},
        status: actionData.confirmationNeeded ? 'confirmation_needed' : 'pending',
        message: actionData.confirmationMessage,
      });
    } catch (error) {
      logger.error('Error parsing action JSON:', error);
      logger.error(`JSON que falló: ${actionMatch[1]?.substring(0, 200)}`);
    }
  }

  if (actions.length === 0) {
    logger.info(`ℹ️ No se encontraron acciones válidas con \<action\> tags`);
    // Limpiar cualquier tag <action> mal formado de la respuesta
    const cleanResponse = response.replace(/<action>[\s\S]*?<\/action>/g, '').trim();
    return { action: null, actions: [], cleanResponse };
  }

  logger.info(`✅ ${actions.length} acción(es) válida(s) encontrada(s)`);
  const cleanResponse = response.replace(/<action>[\s\S]*?<\/action>/g, '').trim();

  // Para compatibilidad con código existente, retornar la primera acción como 'action'
  // pero también retornar todas en 'actions'
  return {
    action: actions[0],
    actions,
    cleanResponse,
  };
}
async function executeAction(
  userId: string,
  planId: string,
  action: ActionResult
): Promise<ActionResult> {
  const supabase = createAdminClient();

  switch (action.type) {
    case 'move_session': {
      const { sessionId, newStartTime, newEndTime } = action.data;

      logger.info(`📅 Moviendo sesión ${sessionId} a ${newStartTime} - ${newEndTime}`);

      // Función para verificar si un timestamp ya tiene offset de timezone
      const hasTimezoneOffset = (timestamp: string): boolean => {
        // Patrones válidos de offset: +HH:MM, -HH:MM, Z
        return /[+-]\d{2}:\d{2}$/.test(timestamp) || timestamp.endsWith('Z');
      };

      // Solo añadir offset si no tiene uno
      let startTimeISO = newStartTime;
      let endTimeISO = newEndTime;

      const tzOffset = getTimezoneOffset(getCurrentTimezone());

      if (!hasTimezoneOffset(newStartTime)) {
        startTimeISO = newStartTime + tzOffset;
      }
      if (!hasTimezoneOffset(newEndTime)) {
        endTimeISO = newEndTime + tzOffset;
      }

      logger.info(`📅 Timestamps ajustados: ${startTimeISO} -> ${endTimeISO}`);

      // Primero sincronizar con el calendario externo (antes de actualizar BD)
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

    case 'delete_session': {
      const { sessionId } = action.data;

      // Primero sincronizar con el calendario externo (antes de eliminar de BD)
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

    case 'resize_session': {
      const { sessionId, newDurationMinutes } = action.data;

      // Obtener sesión actual
      const { data: session } = await supabase
        .from('study_sessions')
        .select('start_time')
        .eq('id', sessionId)
        .eq('user_id', userId)
        .single();

      if (!session) {
        return { ...action, status: 'error', message: 'Sesión no encontrada' };
      }

      // Calcular nuevo end_time
      const startTime = new Date(session.start_time);
      const newEndTime = new Date(startTime.getTime() + newDurationMinutes * 60 * 1000);

      // Sincronizar con calendario
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

    case 'create_session': {
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

    case 'update_session': {
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

    // =========================================================================
    // ACCIONES DE CALENDARIO EXTERNO
    // =========================================================================

    case 'list_calendar_events': {
      const { startDate, endDate } = action.data || {};

      const { accessToken, provider } = await getCalendarAccessToken(userId);

      if (!accessToken || provider !== 'google') {
        return {
          ...action,
          status: 'error',
          message: '❌ No tienes un calendario conectado. Ve a configuración para conectar tu Google Calendar.'
        };
      }

      // Por defecto, mostrar eventos de hoy
      const start = startDate ? new Date(startDate) : new Date();
      start.setHours(0, 0, 0, 0);

      const end = endDate ? new Date(endDate) : new Date(start);
      end.setHours(23, 59, 59, 999);

      const events = await listGoogleCalendarEvents(accessToken, start, end, getCurrentTimezone() || 'America/Mexico_City');

      if (events.length === 0) {
        return {
          ...action,
          status: 'success',
          message: '📅 No tienes eventos programados para ese período.',
          data: { events: [] }
        };
      }

      // Formatear eventos para mostrar
      let eventsList = '📅 **Tus eventos:**\n\n';
      for (const event of events) {
        const typeIcon = event.isStudySession ? '📚' : '📌';
        const timeStr = event.isAllDay
          ? 'Todo el día'
          : `${formatTime(new Date(event.start))} - ${formatTime(new Date(event.end))}`;
        eventsList += `${typeIcon} **${event.title}** (${timeStr})\n`;
      }

      return {
        ...action,
        status: 'success',
        message: eventsList,
        data: { events }
      };
    }

    case 'create_calendar_event': {
      const { title, startTime, endTime, description } = action.data;

      const { accessToken, provider, calendarId } = await getCalendarAccessToken(userId);

      if (!accessToken || provider !== 'google') {
        return {
          ...action,
          status: 'error',
          message: '❌ No tienes un calendario conectado.'
        };
      }

      const eventId = await createGoogleCalendarEvent(
        accessToken,
        { title, start_time: startTime, end_time: endTime, description },
        getCurrentTimezone() || 'America/Mexico_City',
        calendarId
      );

      if (!eventId) {
        return { ...action, status: 'error', message: '❌ Error al crear el evento en el calendario.' };
      }

      return {
        ...action,
        status: 'success',
        message: `✅ Evento "${title}" creado en tu calendario.`,
        data: { eventId }
      };
    }

    case 'move_calendar_event': {
      const { eventId, newStartTime, newEndTime } = action.data;

      const { accessToken, provider, calendarId } = await getCalendarAccessToken(userId);

      if (!accessToken || provider !== 'google') {
        return { ...action, status: 'error', message: '❌ No tienes un calendario conectado.' };
      }

      const success = await moveGoogleCalendarEvent(
        accessToken,
        eventId,
        newStartTime,
        newEndTime,
        getCurrentTimezone() || 'America/Mexico_City',
        calendarId
      );

      if (!success) {
        return { ...action, status: 'error', message: '❌ Error al mover el evento.' };
      }

      return { ...action, status: 'success', message: '✅ Evento movido correctamente en tu calendario.' };
    }

    case 'delete_calendar_event': {
      const { eventId } = action.data;

      const { accessToken, provider, calendarId } = await getCalendarAccessToken(userId);

      if (!accessToken || provider !== 'google') {
        return { ...action, status: 'error', message: '❌ No tienes un calendario conectado.' };
      }

      const success = await deleteGoogleCalendarEvent(accessToken, eventId, calendarId);

      if (!success) {
        return { ...action, status: 'error', message: '❌ Error al eliminar el evento.' };
      }

      return { ...action, status: 'success', message: '✅ Evento eliminado de tu calendario.' };
    }

    // =========================================================================
    // ACCIONES PROACTIVAS DE OPTIMIZACIÓN
    // =========================================================================

    case 'create_micro_session': {
      const { title, startTime, endTime, type } = action.data;

      // Calcular duración para verificar que es una micro-sesión (máx 30 min)
      const start = new Date(startTime);
      const end = new Date(endTime);
      const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));

      if (durationMinutes > 45) {
        return {
          ...action,
          status: 'error',
          message: '❌ Las micro-sesiones deben ser de máximo 45 minutos.'
        };
      }

      const sessionTitle = title || `📝 ${type || 'Micro-sesión de repaso'}`;

      // Crear la sesión en la BD
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

      // Crear evento en el calendario secundario de la plataforma
      const { accessToken, provider, calendarId } = await getCalendarAccessToken(userId);
      if (accessToken && provider === 'google') {
        const eventId = await createGoogleCalendarEvent(
          accessToken,
          {
            title: sessionTitle,
            start_time: startTime,
            end_time: endTime,
            description: session.description || ''
          },
          getCurrentTimezone() || 'America/Mexico_City',
          calendarId
        );

        // Guardar el external_event_id
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
        data: { sessionId: session.id }
      };
    }

    case 'recover_missed_session': {
      const { sessionId, newStartTime, newEndTime } = action.data;

      // Obtener la sesión original
      const { data: originalSession, error: getError } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (getError || !originalSession) {
        return { ...action, status: 'error', message: '❌ Sesión no encontrada.' };
      }

      // Calcular nueva duración
      const start = new Date(newStartTime);
      const end = new Date(newEndTime);
      const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));

      // Actualizar la sesión (cambiar fecha y estado)
      const { error: updateError } = await supabase
        .from('study_sessions')
        .update({
          start_time: newStartTime,
          end_time: newEndTime,
          duration_minutes: durationMinutes,
          status: 'planned', // Cambiar de 'missed' a 'planned'
        })
        .eq('id', sessionId);

      if (updateError) {
        logger.error('Error recuperando sesión:', updateError);
        return { ...action, status: 'error', message: '❌ Error al reprogramar la sesión.' };
      }

      // Sincronizar con calendario
      if (originalSession.external_event_id) {
        // Actualizar evento existente
        await syncSessionWithCalendar(userId, sessionId, 'update', {
          start_time: newStartTime,
          end_time: newEndTime
        });
      } else {
        // Crear nuevo evento en el calendario secundario de la plataforma
        const { accessToken, provider, calendarId } = await getCalendarAccessToken(userId);
        if (accessToken && provider === 'google') {
          const eventId = await createGoogleCalendarEvent(
            accessToken,
            {
              title: originalSession.title,
              start_time: newStartTime,
              end_time: newEndTime,
              description: originalSession.description || ''
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
        data: { sessionId }
      };
    }

    case 'rebalance_plan': {
      let { sessionsToMove } = action.data || {};

      // Timezone offset para México (America/Mexico_City)
      const TZ_OFFSET = '-06:00';

      // Si no se proporcionaron sesiones específicas, calcular automáticamente
      if (!sessionsToMove || !Array.isArray(sessionsToMove) || sessionsToMove.length === 0) {
        logger.info('📋 REBALANCE_PLAN - Calculando sesiones automáticamente...');

        // Obtener sesiones que necesitan ser reprogramadas (overdue o planned en el pasado)
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
            message: '❌ No se encontraron sesiones pendientes para redistribuir.'
          };
        }

        logger.info(`📋 Encontradas ${overdueSessions.length} sesiones overdue para redistribuir`);

        // Calcular slots disponibles en los próximos 7 días
        // Usar los horarios preferidos de las sesiones existentes
        const preferredHours = [8, 9, 10, 17, 18, 19, 20]; // Horas comunes de estudio

        sessionsToMove = [];
        let dayOffset = 0;
        let hourIndex = 0;

        for (const session of overdueSessions) {
          // Buscar el próximo slot disponible
          let foundSlot = false;
          while (!foundSlot && dayOffset < 14) {
            const targetDate = new Date(now);
            targetDate.setDate(targetDate.getDate() + dayOffset);
            targetDate.setHours(preferredHours[hourIndex], 0, 0, 0);

            // Verificar que la fecha/hora esté en el futuro
            if (targetDate > now) {
              const duration = session.duration_minutes || 30;
              const endDate = new Date(targetDate.getTime() + duration * 60 * 1000);

              // Formatear como ISO sin milisegundos + timezone
              const formatWithTZ = (date: Date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const mins = String(date.getMinutes()).padStart(2, '0');
                return `${year}-${month}-${day}T${hours}:${mins}:00${TZ_OFFSET}`;
              };

              sessionsToMove.push({
                sessionId: session.id,
                newStartTime: formatWithTZ(targetDate),
                newEndTime: formatWithTZ(endDate)
              });

              foundSlot = true;
            }

            // Avanzar al siguiente slot
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
            message: '❌ No se pudieron calcular nuevos horarios para las sesiones.'
          };
        }
      }

      logger.info(`📋 REBALANCE_PLAN - Sesiones a mover: ${JSON.stringify(sessionsToMove)}`);

      const results: Array<{ sessionId: string; success: boolean }> = [];

      for (const sessionMove of sessionsToMove) {
        const { sessionId: moveSessionId, newStartTime, newEndTime } = sessionMove;

        logger.info(`🔄 Moviendo sesión ${moveSessionId}: ${newStartTime} -> ${newEndTime}`);

        // Asegurar que los timestamps tengan zona horaria
        let startTimeISO = newStartTime;
        let endTimeISO = newEndTime;

        // Si el timestamp no tiene zona horaria, agregar la de México
        if (!newStartTime.includes('+') && !newStartTime.includes('Z') && !newStartTime.match(/-\d{2}:\d{2}$/)) {
          startTimeISO = newStartTime + TZ_OFFSET;
        }
        if (!newEndTime.includes('+') && !newEndTime.includes('Z') && !newEndTime.match(/-\d{2}:\d{2}$/)) {
          endTimeISO = newEndTime + TZ_OFFSET;
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

          // Sincronizar con calendario
          await syncSessionWithCalendar(userId, moveSessionId, 'update', {
            start_time: startTimeISO,
            end_time: endTimeISO
          });
        } else {
          logger.error(`❌ Error moviendo sesión ${moveSessionId}: ${error.message}`);
          results.push({ sessionId: moveSessionId, success: false });
        }
      }

      const successCount = results.filter(r => r.success).length;

      return {
        ...action,
        status: successCount > 0 ? 'success' : 'error',
        message: successCount > 0
          ? `✅ Plan rebalanceado: ${successCount}/${sessionsToMove.length} sesiones reprogramadas.`
          : '❌ No se pudieron reprogramar las sesiones.',
        data: { results, sessionsRebalanced: successCount }
      };
    }

    case 'reduce_session_load': {
      const { date, sessionsToReduce } = action.data;

      if (!sessionsToReduce || !Array.isArray(sessionsToReduce) || sessionsToReduce.length === 0) {
        return { ...action, status: 'error', message: '❌ No se especificaron sesiones para reducir.' };
      }

      const reduceResults: Array<{ sessionId: string; action: string; success: boolean }> = [];
      const { accessToken, provider, calendarId } = await getCalendarAccessToken(userId);

      for (const sessionAction of sessionsToReduce) {
        const { sessionId: reduceSessionId, reduceAction, newData } = sessionAction;

        if (reduceAction === 'delete') {
          // Obtener la sesión para eliminar del calendario
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

            // Eliminar del calendario secundario
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
                end_time: newEndTime.toISOString()
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
              end_time: newData.endTime
            });
          } else {
            reduceResults.push({ sessionId: reduceSessionId, action: 'moved', success: false });
          }
        }
      }

      const reduceSuccessCount = reduceResults.filter(r => r.success).length;

      return {
        ...action,
        status: reduceSuccessCount > 0 ? 'success' : 'error',
        message: `✅ Carga del ${date} reducida: ${reduceSuccessCount}/${sessionsToReduce.length} cambios aplicados.`,
        data: { results: reduceResults }
      };
    }

    case 'update_calendar_selection': {
      const { selectedCalendarIds } = action.data || {};

      if (!selectedCalendarIds || !Array.isArray(selectedCalendarIds) || selectedCalendarIds.length === 0) {
        return { ...action, status: 'error', message: 'Debes seleccionar al menos un calendario.' };
      }

      logger.info(`📅 Actualizando selección de calendarios: ${selectedCalendarIds.join(', ')}`);

      try {
        await CalendarIntegrationService.saveSelectedCalendarIds(userId, selectedCalendarIds);
        return {
          ...action,
          status: 'success',
          message: `✅ Selección de calendarios actualizada (${selectedCalendarIds.length} calendario${selectedCalendarIds.length > 1 ? 's' : ''} seleccionado${selectedCalendarIds.length > 1 ? 's' : ''}).`
        };
      } catch (calError: any) {
        logger.error('❌ Error actualizando selección de calendarios:', calError);
        return { ...action, status: 'error', message: `Error al actualizar calendarios: ${calError.message}` };
      }
    }

    // Alias para acciones - LIA a veces envía nombres diferentes
    case 'rebalance':
    case 'rebalanzar':
    case 'redistribuir': {
      // Redirigir a rebalance_plan
      logger.info('🔄 Alias detectado para rebalance_plan, redirigiendo...');
      return executeAction(userId, planId, { ...action, type: 'rebalance_plan' });
    }

    default:
      logger.error(`❌ Tipo de acción no reconocido: "${action.type}"`);
      logger.error(`📋 Datos de la acción: ${JSON.stringify(action)}`);
      return { ...action, status: 'error', message: `Acción no reconocida: ${action.type}` };
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ChatResponse>> {
  try {
    // 1. Verificar autenticación
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, response: '', error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    // Inicializar LiaLogger para analytics
    const liaLogger = new SofLIALogger(user.id);
    let conversationId: string | undefined = undefined; // Será asignado más adelante

    const body: ChatRequest = await request.json();
    const { message, conversationHistory, activePlanId, trigger = 'user_message' } = body;

    const isProactiveInit = trigger === 'proactive_init' || (!message && !conversationHistory?.length);

    // Validación: Si no es proactivo, se requiere mensaje
    if (!isProactiveInit && !message?.trim()) {
      return NextResponse.json(
        { success: false, response: '', error: 'Mensaje requerido' },
        { status: 400 }
      );
    }

    // Iniciar conversación en logger
    try {
      const existingId = conversationHistory && conversationHistory.length > 0 ? undefined : undefined; // TODO: Manejar ID existente del frontend si se envía

      conversationId = await liaLogger.startConversation({
        contextType: 'study-planner' as any, // Forzamos el tipo aunque no esté en enum para que el logger lo maneje
        deviceType: request.headers.get('sec-ch-ua-platform') || undefined,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim()
      });

      // Si hay mensaje del usuario, registrarlo
      if (message) {
        await liaLogger.logMessage('user', message);
      }
    } catch (logError) {
      logger.warn('[StudyPlanner] Falló inicio de conversación logger:', logError);
      // Continuamos sin bloquear
    }

    // 3. Inicializar Google Gemini
    const googleApiKey = process.env.GOOGLE_API_KEY;
    if (!googleApiKey) {
      logger.error('❌ GOOGLE_API_KEY no configurada');
      return NextResponse.json({ success: false, response: '', error: 'Error de configuración de IA' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(googleApiKey);

    // Configuración desde variables de entorno
    // IMPORTANTE: Solo usar modelos válidos de Gemini
    let modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';

    // Validar que el modelo sea uno conocido, sino usar el default
    const validModels = ['gemini-2.0-flash-exp', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
    if (!validModels.some(m => modelName.includes(m.split('-')[0]))) {
      logger.warn(`⚠️ Modelo "${modelName}" no reconocido, usando gemini-2.0-flash-exp`);
      modelName = 'gemini-2.0-flash-exp';
    }

    const temperature = parseFloat(process.env.GEMINI_TEMPERATURE || '0.7');
    const maxOutputTokens = parseInt(process.env.GEMINI_MAX_TOKENS || '8192');

    const model = genAI.getGenerativeModel({
      model: modelName,
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
      generationConfig: {
        maxOutputTokens, // 8192
        temperature,     // 0.7
      }
    });

    // 4. Obtener contexto del plan
    const { context: planContext, syncResult, timezone } = await getPlanContext(user.id, activePlanId);

    setCurrentTimezone(timezone);

    // 5. Preparar historial
    const chatHistory = conversationHistory
      ?.slice(-10)
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      })) || [];

    // Validar historial para Gemini
    while (chatHistory.length > 0 && chatHistory[0].role === 'model') {
      chatHistory.shift();
    }

    // 6. Construcción Dinámica del Prompt (Sin Prompt Maestro estático)
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: timezone,
    };
    const currentDateTime = now.toLocaleDateString('es-MX', options);

    // Construimos la instrucción del sistema en tiempo real con los datos frescos
    const dynamicSystemInstruction = `
${BASE_LIA_INSTRUCTION}

DATOS EN TIEMPO REAL:
- Fecha/Hora: ${currentDateTime} (Zona: ${timezone})
- Usuario ID: ${user.id}

ESTADO DEL PLAN Y CALENDARIO (CONTEXTO):
${planContext}

INSTRUCCIÓN ESPECIAL PARA ESTA INTERACCIÓN:
${isProactiveInit
        ? 'CONTEXTO: El usuario acaba de abrir el dashboard. NO ha enviado ningún mensaje aún. TÚ DEBES INICIAR LA CONVERSACIÓN.\nTAREA: Analiza el contexto de arriba (conflictos, atrasos, sesiones perdidas).\n- SI HAY PROBLEMAS: Pregunta DIRECTAMENTE al usuario si quiere resolverlos (ej: "Veo que perdiste la sesión X, ¿la reprogramamos?"). NO esperes a que él pregunte.\n- SI TODO ESTÁ BIEN: Saluda brevemente y menciona la próxima sesión.\n- IMPORTANTE: No digas "Hola" genérico. Ve genial contexto.'
        : 'El usuario ha respondido. Continúa la conversación ayudándole a gestionar su plan.'}
`;

    // 7. Iniciar Chat - systemInstruction debe ser un objeto con parts para versiones recientes del SDK
    const chatSession = model.startChat({
      history: chatHistory,
      systemInstruction: {
        role: 'user',
        parts: [{ text: dynamicSystemInstruction }]
      }
    });

    logger.info(`🤖 LIA (${trigger}): Analizando contexto con Gemini...`);

    try {
      // Si es proactivo, enviamos un input interno para detonar el análisis
      const userMessage = isProactiveInit
        ? 'Hola LIA, acabo de entrar. ¿Hay algo de mi plan que deba atender hoy?'
        : message!;

      const result = await chatSession.sendMessage(userMessage);
      // 7. Enviar respuesta
      const responseText = result.response.text();
      const usage = result.response.usageMetadata;

      // Registrar respuesta en logger (solo si la conversación se creó exitosamente)
      if (conversationId && liaLogger.getCurrentConversationId()) {
        // Calcular costos si hay metadata
        let usageMetadata = undefined;
        if (usage) {
          const promptTokens = usage.promptTokenCount || 0;
          const completionTokens = usage.candidatesTokenCount || 0;
          const totalTokens = usage.totalTokenCount || 0;

          const estimatedCost = calculateCost(promptTokens, completionTokens, modelName);

          // Registrar usage globalmente también
          if (user) {
            logOpenAIUsage({
              userId: user.id,
              timestamp: new Date(),
              model: modelName,
              promptTokens,
              completionTokens,
              totalTokens,
              estimatedCost
            });
          }

          usageMetadata = {
            tokensUsed: totalTokens,
            costUsd: estimatedCost,
            modelUsed: modelName
          };
        }

        try {
          await liaLogger.logMessage(
            'assistant',
            responseText,
            false,
            usageMetadata
          );
        } catch (logError: any) {
          // Solo loggear errores distintos a FK violation (23503) para evitar spam
          if (logError?.code !== '23503') {
            logger.warn('[StudyPlanner] Falló log de respuesta:', logError);
          }
        }
      }

      // 8. Procesar respuesta
      const { action, actions, cleanResponse } = extractAction(responseText);

      let executedAction: ActionResult | undefined;

      // Ejecutar acciones que no requieren confirmación (pending)
      if (actions.length > 0 && activePlanId) {
        const pendingActions = actions.filter(a => a.status === 'pending');
        const confirmationNeededActions = actions.filter(a => a.status === 'confirmation_needed');

        // Ejecutar secuencialmente las acciones pendientes
        if (pendingActions.length > 0) {
          logger.info(`⚡ Ejecutando ${pendingActions.length} acciones automáticas...`);
          const executionResults = await Promise.all(
            pendingActions.map(a => executeAction(user.id, activePlanId, a))
          );

          // Tomar la última ejecutada (o la primera fallida) para el retorno al frontend
          // (El frontend actual parece manejar solo una acción principal en el callback, 
          // aunque el chat muestre múltiples resultados textuales 'cleanResponse')
          const failedAction = executionResults.find(r => r.status === 'error');
          executedAction = failedAction || executionResults[executionResults.length - 1];
        }

        // Si hay una acción que requiere confirmación y no ejecutamos nada aún (o además),
        // la devolvemos para que el frontend pida confirmación.
        if (confirmationNeededActions.length > 0 && !executedAction) {
          executedAction = confirmationNeededActions[0];
        }
      } else if (action) {
        // Fallback legacy (si extractAction devolvió algo en single 'action' pero no en array, improbable con el código actual)
        executedAction = action;
      }

      return NextResponse.json({
        success: true,
        response: cleanResponse,
        action: executedAction,
      });

    } catch (apiError: any) {
      logger.error('❌ Error llamando a Gemini API:', apiError);

      // Fallback elegante en caso de sobrecarga o error de API
      return NextResponse.json({
        success: false,
        response: 'Lo siento, tuve un problema técnico momentáneo. ¿Podrías intentar de nuevo?',
        error: apiError.message
      });
    }

  } catch (error) {
    logger.error('Error crítico en chat del dashboard:', error);
    return NextResponse.json(
      {
        success: false,
        response: 'Ocurrió un error inesperado en el servidor.',
        error: error instanceof Error ? error.message : 'Error interno'
      },
      { status: 500 }
    );
  }
}
