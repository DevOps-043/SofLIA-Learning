/**
 * Calendar Service
 * Handles all Google Calendar API operations and Supabase admin client creation.
 */

import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createAdminClient as createSharedAdminClient } from '@/lib/supabase/admin';
import type { Database } from '../../../../../lib/supabase/types';
import { logger } from '../../../../../lib/utils/logger';
import { CalendarIntegrationService } from '../../../../../features/study-planner/services/calendar-integration.service';
import type { CalendarEvent } from './types';

interface CalendarIntegrationData {
  id: string;
  provider: 'google' | 'microsoft';
  access_token: string;
  refresh_token?: string | null;
  expires_at?: string | null;
  metadata?: { secondary_calendar_id?: string } | null;
}

export interface SessionCalendarSyncMetadata {
  provider: 'google' | 'microsoft';
  calendarId?: string | null;
  externalEventId: string;
  normalizedExternalEventId: string;
  source: 'save_plan' | 'sync' | 'manual_action' | 'resync';
  lastSyncedAt: string;
}

export interface SessionMetricsPayload {
  clientReferenceId?: string;
  plannedCourseId?: string | null;
  plannedLessonIds?: string[];
  plannedLessonTitles?: string[];
  plannedLessons?: Array<{
    courseId?: string;
    courseTitle?: string;
    lessonId?: string;
    lessonTitle?: string;
    durationMinutes?: number;
  }>;
  calendarSync?: SessionCalendarSyncMetadata | null;
}

export interface StudySessionCalendarLinkRecord {
  id: string;
  plan_id?: string | null;
  external_event_id?: string | null;
  calendar_provider?: 'google' | 'microsoft' | null;
  metrics?: SessionMetricsPayload | null;
}

export function normalizeCalendarEventId(eventId: string | null | undefined): string {
  if (!eventId) {
    return '';
  }

  return String(eventId).trim();
}

export function parseSessionMetrics(
  metrics: unknown,
): SessionMetricsPayload | null {
  if (!metrics || typeof metrics !== 'object' || Array.isArray(metrics)) {
    return null;
  }

  return metrics as SessionMetricsPayload;
}

export function resolveSessionCalendarSync(params: {
  externalEventId?: string | null;
  calendarProvider?: 'google' | 'microsoft' | null;
  metrics?: unknown;
}): SessionCalendarSyncMetadata | null {
  const parsedMetrics = parseSessionMetrics(params.metrics);
  const metricsSync = parsedMetrics?.calendarSync || null;

  if (metricsSync?.externalEventId && metricsSync.provider) {
    return {
      ...metricsSync,
      normalizedExternalEventId:
        metricsSync.normalizedExternalEventId
        || normalizeCalendarEventId(metricsSync.externalEventId),
      calendarId: metricsSync.calendarId || null,
      source: metricsSync.source || 'sync',
      lastSyncedAt: metricsSync.lastSyncedAt || new Date().toISOString(),
    };
  }

  if (params.externalEventId && params.calendarProvider) {
    return {
      provider: params.calendarProvider,
      externalEventId: params.externalEventId,
      normalizedExternalEventId: normalizeCalendarEventId(params.externalEventId),
      calendarId: null,
      source: 'sync',
      lastSyncedAt: new Date().toISOString(),
    };
  }

  return null;
}

function mergeSessionMetricsWithCalendarSync(params: {
  existingMetrics?: unknown;
  eventId: string;
  provider: 'google' | 'microsoft';
  calendarId?: string | null;
  source?: SessionCalendarSyncMetadata['source'];
}): SessionMetricsPayload {
  const parsedMetrics = parseSessionMetrics(params.existingMetrics) || {};

  return {
    ...parsedMetrics,
    calendarSync: {
      provider: params.provider,
      calendarId: params.calendarId || null,
      externalEventId: params.eventId,
      normalizedExternalEventId: normalizeCalendarEventId(params.eventId),
      source: params.source || 'sync',
      lastSyncedAt: new Date().toISOString(),
    },
  };
}

export function buildSessionCalendarSyncPatch(params: {
  eventId: string;
  provider: 'google' | 'microsoft';
  calendarId?: string | null;
  existingMetrics?: unknown;
  source?: SessionCalendarSyncMetadata['source'];
}): Pick<
  Database['public']['Tables']['study_sessions']['Update'],
  'external_event_id' | 'calendar_provider' | 'updated_at' | 'metrics'
> {
  return {
    external_event_id: params.eventId,
    calendar_provider: params.provider,
    metrics: mergeSessionMetricsWithCalendarSync({
      existingMetrics: params.existingMetrics,
      eventId: params.eventId,
      provider: params.provider,
      calendarId: params.calendarId,
      source: params.source,
    }),
    updated_at: new Date().toISOString(),
  };
}

export async function persistSessionCalendarSync(params: {
  supabase?: ReturnType<typeof createAdminClient>;
  sessionId: string;
  eventId: string;
  provider: 'google' | 'microsoft';
  calendarId?: string | null;
  source?: SessionCalendarSyncMetadata['source'];
  existingSession?: StudySessionCalendarLinkRecord | null;
}): Promise<void> {
  const supabase = params.supabase ?? createAdminClient();
  const sessionRecord =
    params.existingSession
    || (
      await supabase
        .from('study_sessions')
        .select('id, plan_id, external_event_id, calendar_provider, metrics')
        .eq('id', params.sessionId)
        .single()
    ).data;

  const { error } = await supabase
    .from('study_sessions')
    .update(
      buildSessionCalendarSyncPatch({
        eventId: params.eventId,
        provider: params.provider,
        calendarId: params.calendarId,
        existingMetrics: sessionRecord?.metrics,
        source: params.source,
      }),
    )
    .eq('id', params.sessionId);

  if (error) {
    throw new Error(`Error guardando sincronizacion de calendario: ${error.message}`);
  }
}

export function createAdminClient() {
  return createSharedAdminClient();
}

/**
 * Crea un cliente de Supabase con Service Role Key para bypass de RLS
 */
export function createLegacyAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurada.');
  }

  return createServiceClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Obtiene el access token válido del usuario para el calendario
 */
export async function getCalendarAccessToken(userId: string): Promise<{
  accessToken: string | null;
  provider: string | null;
  calendarId: string | null;
}> {
  const supabase = createAdminClient();

  const { data: integration } = await supabase
    .from('calendar_integrations')
    .select('id, provider, access_token, refresh_token, expires_at, metadata')
    .eq('user_id', userId)
    .single();

  logger.info(`🔑 getCalendarAccessToken - integración encontrada: ${!!integration}, access_token: ${integration?.access_token ? 'SÍ' : 'NO'}`);

  if (!integration || !integration.access_token) {
    logger.warn('⚠️ No hay integración de calendario o no hay access_token');
    return { accessToken: null, provider: null, calendarId: null };
  }

  // Obtener el calendarId del calendario secundario de la plataforma
  const metadata = integration.metadata as { secondary_calendar_id?: string } | null;
  let calendarId = metadata?.secondary_calendar_id || null;

  // Verificar si el token ha expirado
  const expiresAt = integration.expires_at ? new Date(integration.expires_at) : null;
  const now = new Date();

  logger.info(`🔑 Token expira: ${expiresAt?.toISOString() || 'desconocido'}, ahora: ${now.toISOString()}`);

  let accessToken = integration.access_token;

  if (expiresAt && expiresAt < now && integration.refresh_token) {
    logger.info('🔄 Token expirado, refrescando...');
    // Refrescar token
    const refreshed = await refreshAccessToken(integration);
    if (refreshed.success && refreshed.accessToken) {
      logger.info('✅ Token refrescado exitosamente');
      accessToken = refreshed.accessToken;
    } else {
      logger.error('❌ Error refrescando token');
    }
  }

  // Si no hay calendario secundario, intentar crearlo (solo para Google)
  if (!calendarId && integration.provider === 'google' && accessToken) {
    logger.info('📅 Creando/obteniendo calendario secundario...');
    calendarId = await CalendarIntegrationService.getOrCreatePlatformCalendar(accessToken);

    if (calendarId) {
      // Guardar el calendarId para futuras operaciones
      await supabase
        .from('calendar_integrations')
        .update({
          metadata: { secondary_calendar_id: calendarId },
          updated_at: new Date().toISOString()
        })
        .eq('id', integration.id);

      logger.info(`✅ Calendario secundario obtenido/creado: ${calendarId}`);
    }
  }

  return { accessToken, provider: integration.provider, calendarId };
}

/**
 * Refresca el access token
 */
export async function refreshAccessToken(integration: CalendarIntegrationData): Promise<{ success: boolean; accessToken?: string }> {
  try {
    if (integration.provider === 'google') {
      const GOOGLE_CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID ||
        process.env.GOOGLE_CLIENT_ID || '';
      const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET ||
        process.env.GOOGLE_CLIENT_SECRET || '';

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          refresh_token: integration.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        logger.error('Error refrescando token de Google:', await response.text());
        return { success: false };
      }

      const tokens = await response.json();

      const supabase = createAdminClient();
      await supabase
        .from('calendar_integrations')
        .update({
          access_token: tokens.access_token,
          expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        })
        .eq('id', integration.id);

      return { success: true, accessToken: tokens.access_token };
    }

    // Agregar soporte para Microsoft si es necesario
    return { success: false };
  } catch (error) {
    logger.error('Error refrescando token:', error);
    return { success: false };
  }
}

async function findGoogleEventBySessionIdentity(params: {
  accessToken: string;
  sessionId: string;
  calendarId?: string | null;
}): Promise<{ eventId: string; calendarId: string } | null> {
  const calendarsToTry = Array.from(
    new Set([params.calendarId || null, 'primary'].filter(Boolean) as string[]),
  );

  for (const calendarId of calendarsToTry) {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?privateExtendedProperty=${encodeURIComponent(`sofliaSessionId=${params.sessionId}`)}&singleEvents=true&maxResults=1`,
      {
        headers: {
          Authorization: `Bearer ${params.accessToken}`,
        },
      },
    );

    if (!response.ok) {
      continue;
    }

    const payload = await response.json() as { items?: Array<{ id?: string }> };
    const eventId = payload.items?.[0]?.id;
    if (eventId) {
      return { eventId, calendarId };
    }
  }

  return null;
}

/**
 * Actualiza un evento en Google Calendar
 * IMPORTANTE: Usa el calendario secundario de la plataforma si está disponible
 */
export async function updateGoogleCalendarEvent(
  accessToken: string,
  eventId: string,
  session: { title: string; start_time: string; end_time: string; description?: string },
  timezone: string,
  calendarId: string | null = null,
  sessionId?: string,
): Promise<boolean> {
  try {
    const event = {
      summary: session.title,
      description: session.description || '',
      start: {
        dateTime: new Date(session.start_time).toISOString(),
        timeZone: timezone,
      },
      end: {
        dateTime: new Date(session.end_time).toISOString(),
        timeZone: timezone,
      },
    };

    const targetCalendarId = calendarId || 'primary';
    logger.info(`📅 Actualizando evento en Google Calendar: ${eventId} (calendario: ${targetCalendarId === 'primary' ? 'principal' : 'secundario'})`);

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events/${eventId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      if (response.status === 404 && sessionId) {
        const linkedEvent = await findGoogleEventBySessionIdentity({
          accessToken,
          sessionId,
          calendarId: targetCalendarId,
        });

        if (linkedEvent) {
          return updateGoogleCalendarEvent(
            accessToken,
            linkedEvent.eventId,
            session,
            timezone,
            linkedEvent.calendarId,
          );
        }
      }

      const errorText = await response.text();
      logger.error('❌ Error actualizando evento en Google Calendar:', errorText);
      return false;
    }

    logger.info('✅ Evento actualizado en Google Calendar');
    return true;
  } catch (error) {
    logger.error('Error en updateGoogleCalendarEvent:', error);
    return false;
  }
}

/**
 * Elimina un evento de Google Calendar
 * IMPORTANTE: Usa el calendario secundario de la plataforma si está disponible
 */
export async function deleteGoogleCalendarEvent(
  accessToken: string,
  eventId: string,
  calendarId: string | null = null,
  sessionId?: string,
): Promise<boolean> {
  try {
    const cleanEventId = normalizeCalendarEventId(eventId);
    const targetCalendarId = calendarId || 'primary';
    logger.info(`🗑️ Eliminando evento de Google Calendar: ${eventId} (calendario: ${targetCalendarId === 'primary' ? 'principal' : 'secundario'})`);

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events/${encodeURIComponent(cleanEventId)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (response.status === 404 && targetCalendarId !== 'primary') {
      const fallbackResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(cleanEventId)}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      )

      if (fallbackResponse.ok || fallbackResponse.status === 404) {
        logger.info('✅ Evento eliminado de Google Calendar');
        return true;
      }

      const fallbackErrorText = await fallbackResponse.text();
      logger.error('❌ Error eliminando evento de Google Calendar en fallback primary:', fallbackErrorText);
      return false;
    }

    if (response.status === 404 && sessionId) {
      const linkedEvent = await findGoogleEventBySessionIdentity({
        accessToken,
        sessionId,
        calendarId: targetCalendarId,
      });

      if (linkedEvent) {
        return deleteGoogleCalendarEvent(
          accessToken,
          linkedEvent.eventId,
          linkedEvent.calendarId,
        );
      }
    }

    if (!response.ok && response.status !== 404) {
      const errorText = await response.text();
      logger.error('❌ Error eliminando evento de Google Calendar:', errorText);
      return false;
    }

    logger.info('✅ Evento eliminado de Google Calendar');
    return true;
  } catch (error) {
    logger.error('Error en deleteGoogleCalendarEvent:', error);
    return false;
  }
}

/**
 * Crea un nuevo evento en Google Calendar
 * IMPORTANTE: Usa el calendario secundario de la plataforma si está disponible
 */
export async function createGoogleCalendarEvent(
  accessToken: string,
  session: {
    title: string;
    start_time: string;
    end_time: string;
    description?: string;
    sessionId?: string;
    planId?: string | null;
    clientReferenceId?: string;
  },
  timezone: string,
  calendarId: string | null = null
): Promise<string | null> {
  try {
    const event = {
      summary: session.title,
      description: session.description || '',
      start: {
        dateTime: new Date(session.start_time).toISOString(),
        timeZone: timezone,
      },
      end: {
        dateTime: new Date(session.end_time).toISOString(),
        timeZone: timezone,
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 15 },
        ],
      },
      extendedProperties: {
        private: {
          ...(session.sessionId ? { sofliaSessionId: session.sessionId } : {}),
          ...(session.planId ? { sofliaPlanId: session.planId } : {}),
          ...(session.clientReferenceId
            ? { sofliaClientReferenceId: session.clientReferenceId }
            : {}),
        },
      },
    };

    const targetCalendarId = calendarId || 'primary';
    logger.info(`📅 Creando nuevo evento en Google Calendar: ${session.title} (calendario: ${targetCalendarId === 'primary' ? 'principal' : 'secundario'})`);
    logger.info(`   Inicio: ${event.start.dateTime} (${timezone})`);
    logger.info(`   Fin: ${event.end.dateTime} (${timezone})`);

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('❌ Error creando evento en Google Calendar:', errorText);
      return null;
    }

    const createdEvent = await response.json();
    logger.info(`✅ Evento creado en Google Calendar con ID: ${createdEvent.id}`);
    return createdEvent.id;
  } catch (error) {
    logger.error('Error en createGoogleCalendarEvent:', error);
    return null;
  }
}

/**
 * Listar eventos del Google Calendar, limitado a los calendarios seleccionados por el usuario.
 *
 * @param studySessionEventIds - Set of external_event_id values from study_sessions table.
 *   When provided, events whose ID is in this set are marked as study sessions.
 * @param selectedCalendarIds - IDs de calendarios configurados por el usuario. Si se omite,
 *   se consultan TODOS los calendarios (comportamiento anterior, no deseado).
 */
export async function listGoogleCalendarEvents(
  accessToken: string,
  startDate: Date,
  endDate: Date,
  timezone: string,
  studySessionEventIds?: Set<string>,
  selectedCalendarIds?: string[] | null,
): Promise<CalendarEvent[]> {
  try {
    logger.info(`📅 Obteniendo eventos de Google Calendar (calendarios: ${selectedCalendarIds?.length ? selectedCalendarIds.join(', ') : 'todos'}): ${startDate.toISOString()} - ${endDate.toISOString()}`);

    // Usar el servicio centralizado, filtrando por calendarios seleccionados
    const events = await CalendarIntegrationService.getGoogleCalendarEvents(
      accessToken,
      startDate,
      endDate,
      selectedCalendarIds ?? undefined,
    );

    // Transformar al formato esperado
    return events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      start: event.startTime,
      end: event.endTime,
      isAllDay: event.isAllDay,
      // Determinar si es una sesión de estudio usando el external_event_id de la BD.
      // Si no se pasa el set, caer en la heurística de texto como fallback.
      isStudySession: studySessionEventIds
        ? studySessionEventIds.has(event.id)
        : (event.title?.includes('📚') || event.description?.includes('Aprende y Aplica')) ?? false,
    }));
  } catch (error) {
    logger.error('Error en listGoogleCalendarEvents:', error);
    return [];
  }
}

/**
 * Mover un evento en Google Calendar
 * IMPORTANTE: Usa el calendario secundario de la plataforma si está disponible
 */
export async function moveGoogleCalendarEvent(
  accessToken: string,
  eventId: string,
  newStart: string,
  newEnd: string,
  timezone: string,
  calendarId: string | null = null,
  sessionId?: string,
): Promise<boolean> {
  try {
    const targetCalendarId = calendarId || 'primary';
    logger.info(`📅 Moviendo evento en Google Calendar: ${eventId} (calendario: ${targetCalendarId === 'primary' ? 'principal' : 'secundario'})`);

    // Primero obtener el evento actual para preservar otros campos
    const getResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events/${eventId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!getResponse.ok) {
      logger.error('❌ Error obteniendo evento para mover:', await getResponse.text());
      return false;
    }

    const existingEvent = await getResponse.json();

    // Actualizar solo las fechas
    const updatedEvent = {
      ...existingEvent,
      start: {
        dateTime: new Date(newStart).toISOString(),
        timeZone: timezone,
      },
      end: {
        dateTime: new Date(newEnd).toISOString(),
        timeZone: timezone,
      },
    };

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events/${eventId}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedEvent),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('❌ Error moviendo evento en Google Calendar:', errorText);
      return false;
    }

    logger.info('✅ Evento movido en Google Calendar');
    return true;
  } catch (error) {
    logger.error('Error en moveGoogleCalendarEvent:', error);
    return false;
  }
}

/**
 * Sincroniza cambios de sesión con el calendario externo
 * Si la sesión no tiene external_event_id, crea un nuevo evento
 */
export async function syncSessionWithCalendar(
  userId: string,
  sessionId: string,
  action: 'update' | 'delete',
  newData?: { start_time: string; end_time: string },
  currentTimezone: string = 'America/Mexico_City'
): Promise<{ success: boolean; message?: string }> {
  const supabase = createAdminClient();

  logger.info(`🔄 syncSessionWithCalendar iniciado - sessionId: ${sessionId}, action: ${action}`);

  // Obtener la sesión con su external_event_id
  const { data: session, error: sessionError } = await supabase
    .from('study_sessions')
    .select('id, title, description, start_time, end_time, external_event_id, calendar_provider, plan_id, metrics')
    .eq('id', sessionId)
    .single();

  logger.info(`📋 Sesión obtenida: ${JSON.stringify({
    found: !!session,
    title: session?.title,
    external_event_id: session?.external_event_id,
    error: sessionError?.message
  })}`);

  if (!session) {
    logger.error('❌ Sesión no encontrada:', sessionError);
    return { success: false, message: 'Sesión no encontrada' };
  }

  // Obtener zona horaria del plan
  let timezone = currentTimezone || 'America/Mexico_City';
  if (session.plan_id) {
    const { data: plan } = await supabase
      .from('study_plans')
      .select('timezone')
      .eq('id', session.plan_id)
      .single();
    timezone = plan?.timezone || currentTimezone || 'America/Mexico_City';
  }

  // Obtener token de acceso y calendarId del calendario secundario
  const { accessToken, provider, calendarId } = await getCalendarAccessToken(userId);
  const calendarSync = resolveSessionCalendarSync({
    externalEventId: session.external_event_id,
    calendarProvider: session.calendar_provider,
    metrics: session.metrics,
  });

  logger.info(`🔑 Token obtenido: ${accessToken ? 'SÍ' : 'NO'}, provider: ${provider}, calendarId: ${calendarId || 'primario'}`);

  if (!accessToken) {
    logger.warn('⚠️ No hay integración de calendario para este usuario');
    return { success: true, message: 'Sin calendario conectado' };
  }

  if (provider !== 'google') {
    logger.warn(`⚠️ Proveedor ${provider} no soportado aún`);
    return { success: false, message: 'Proveedor de calendario no soportado' };
  }

  // Si la sesión tiene external_event_id, actualizar o eliminar
  if (session.external_event_id) {
    logger.info(`📅 Sesión tiene external_event_id: ${session.external_event_id}`);

    if (action === 'delete') {
      const success = await deleteGoogleCalendarEvent(
        accessToken,
        calendarSync?.externalEventId || session.external_event_id,
        calendarSync?.calendarId || calendarId,
        sessionId,
      );
      return { success, message: success ? 'Evento eliminado del calendario' : 'Error eliminando del calendario' };
    } else if (action === 'update' && newData) {
      const success = await updateGoogleCalendarEvent(
        accessToken,
        calendarSync?.externalEventId || session.external_event_id,
        {
          title: session.title,
          description: session.description || '',
          start_time: newData.start_time,
          end_time: newData.end_time,
          sessionId: session.id,
          planId: session.plan_id,
          clientReferenceId:
            typeof parseSessionMetrics(session.metrics)?.clientReferenceId === 'string'
              ? parseSessionMetrics(session.metrics)?.clientReferenceId
              : undefined,
        },
        timezone,
        calendarSync?.calendarId || calendarId,
        sessionId
      );
      return { success, message: success ? 'Calendario actualizado' : 'Error actualizando calendario' };
    }
  } else {
    // La sesión NO tiene external_event_id - crear nuevo evento si es una actualización
    logger.warn('⚠️ Sesión sin external_event_id - intentando crear evento en calendario');

    if (action === 'update' && newData) {
      // Crear nuevo evento en el calendario secundario
      const eventId = await createGoogleCalendarEvent(
        accessToken,
        {
          title: session.title,
          description: session.description || '',
          start_time: newData.start_time,
          end_time: newData.end_time,
        },
        timezone,
        calendarId
      );

      if (eventId) {
        // Guardar el external_event_id en la sesión
        try {
          await persistSessionCalendarSync({
            supabase,
            sessionId,
            eventId,
            provider: 'google',
            calendarId,
            source: 'resync',
            existingSession: session,
          });
          logger.info(`✅ external_event_id guardado en sesión: ${eventId}`);
        } catch (error) {
          logger.error('❌ Error guardando external_event_id:', error);
        }

        return { success: true, message: 'Evento creado en calendario' };
      } else {
        return { success: false, message: 'Error creando evento en calendario' };
      }
    } else if (action === 'delete') {
      // No hay evento que eliminar
      logger.info('ℹ️ No hay evento externo que eliminar');
      return { success: true, message: 'Sin evento externo que eliminar' };
    }
  }

  return { success: false, message: 'Acción no procesada' };
}
