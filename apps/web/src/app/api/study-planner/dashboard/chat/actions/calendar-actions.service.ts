/**
 * Calendar Actions Service
 * Handles external Google Calendar CRUD operations.
 */

import {
  getCalendarAccessToken,
  listGoogleCalendarEvents,
  createGoogleCalendarEvent,
  moveGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
} from '../calendar.service';
import { getCurrentTimezone, formatTime } from '../format.utils';
import type { ActionResult } from '../types';

export async function executeListCalendarEvents(
  userId: string,
  _planId: string,
  action: ActionResult
): Promise<ActionResult> {
  const { startDate, endDate } = action.data || {};
  const { accessToken, provider } = await getCalendarAccessToken(userId);

  if (!accessToken || provider !== 'google') {
    return {
      ...action,
      status: 'error',
      message: '❌ No tienes un calendario conectado. Ve a configuración para conectar tu Google Calendar.',
    };
  }

  const start = startDate ? new Date(startDate) : new Date();
  start.setHours(0, 0, 0, 0);

  const end = endDate ? new Date(endDate) : new Date(start);
  end.setHours(23, 59, 59, 999);

  const events = await listGoogleCalendarEvents(
    accessToken,
    start,
    end,
    getCurrentTimezone() || 'America/Mexico_City'
  );

  if (events.length === 0) {
    return {
      ...action,
      status: 'success',
      message: '📅 No tienes eventos programados para ese período.',
      data: { events: [] },
    };
  }

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
    data: { events },
  };
}

export async function executeCreateCalendarEvent(
  userId: string,
  _planId: string,
  action: ActionResult
): Promise<ActionResult> {
  const { title, startTime, endTime, description } = action.data;
  const { accessToken, provider, calendarId } = await getCalendarAccessToken(userId);

  if (!accessToken || provider !== 'google') {
    return { ...action, status: 'error', message: '❌ No tienes un calendario conectado.' };
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
    data: { eventId },
  };
}

export async function executeMoveCalendarEvent(
  userId: string,
  _planId: string,
  action: ActionResult
): Promise<ActionResult> {
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

export async function executeDeleteCalendarEvent(
  userId: string,
  _planId: string,
  action: ActionResult
): Promise<ActionResult> {
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
