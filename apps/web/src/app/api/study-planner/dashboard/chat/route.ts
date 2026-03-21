/**
 * API Endpoint: Study Planner Dashboard Chat
 * 
 * POST /api/study-planner/dashboard/chat
 * 
 * Procesa mensajes del usuario y ejecuta acciones sobre el plan de estudios.
 * LIA puede:
 * - Mover sesiones de estudio
 * - Eliminar bloques de estudio
 * - Ampliar o reducir sesiones
 * - Crear nuevas sesiones
 * - Sugerir ajustes basados en cambios del calendario
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

import { SessionService } from '../../../../../features/auth/services/session.service';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import type { Database } from '../../../../../lib/supabase/types';
import { logger } from '../../../../../lib/utils/logger';
import { CalendarIntegrationService } from '../../../../../features/study-planner/services/calendar-integration.service';
import { SofLIALogger } from '../../../../../lib/analytics/lia-logger';
import { calculateCost, logOpenAIUsage } from '../../../../../lib/openai/usage-monitor';

/**
 * Crea un cliente de Supabase con Service Role Key para bypass de RLS
 */

function createAdminClient() {
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



// Tipos de acciones disponibles
type ActionType =
  | 'move_session'
  | 'delete_session'
  | 'resize_session'
  | 'create_session'
  | 'update_session'
  | 'reschedule_sessions'
  | 'get_plan_summary'
  // Acciones de calendario externo
  | 'list_calendar_events'
  | 'create_calendar_event'
  | 'move_calendar_event'
  | 'delete_calendar_event'
  // Acciones proactivas de optimización
  | 'rebalance_plan'        // Redistribuir sesiones cuando el plan está atrasado
  | 'create_micro_session'  // Crear sesión corta de 15-30 min para ventanas libres
  | 'reduce_session_load'   // Reducir carga de días sobrecargados
  | 'recover_missed_session' // Reprogramar una sesión perdida
  // Configuración de calendarios
  | 'update_calendar_selection' // Cambiar qué calendarios considerar para disponibilidad
  // Alias que LIA a veces envía
  | 'rebalance'
  | 'rebalanzar'
  | 'redistribuir'
  | 'none';

interface ActionResult {
  type: ActionType;
  data?: any;
  status: 'success' | 'error' | 'pending' | 'confirmation_needed';
  message?: string;
}

interface ChatRequest {
  message?: string; // Opcional para triggers proactivos
  conversationHistory?: Array<{ role: string; content: string }>;
  activePlanId?: string;
  trigger?: 'user_message' | 'proactive_init';
}

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

interface ChatResponse {
  success: boolean;
  response: string;
  action?: ActionResult;
  error?: string;
}

// Sistema de prompts para LIA en el dashboard


// ============================================================================
// Función de sincronización bidireccional con calendario
// ============================================================================

interface SyncResult {
  deletedFromDb: string[];
  orphanedSessions: string[];
  message: string;
}

/**
 * Sincroniza las sesiones de la BD con el calendario de Google.
 * Compara las sesiones de estudio en la BD contra los eventos del calendario:
 * 1. Si una sesión tiene external_event_id y el evento no existe → eliminar de BD
 * 2. Si una sesión NO tiene external_event_id, buscar por título/hora en el calendario
 *    - Si no se encuentra en el calendario → eliminar de BD (fue eliminada externamente)
 */
async function syncSessionsWithCalendar(
  userId: string,
  planId: string,
  accessToken: string,
  calendarEvents: CalendarEvent[] // Eventos del calendario ya obtenidos
): Promise<SyncResult> {
  const supabase = createAdminClient();
  const result: SyncResult = {
    deletedFromDb: [],
    orphanedSessions: [],
    message: ''
  };

  logger.info('🔄 Iniciando sincronización bidireccional con calendario...');

  // Obtener TODAS las sesiones de estudio del plan (últimos 7 días + próximos 30 días)
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const { data: allSessions, error } = await supabase
    .from('study_sessions')
    .select('id, title, external_event_id, start_time, end_time')
    .eq('plan_id', planId)
    .gte('start_time', oneWeekAgo.toISOString())
    .lte('start_time', thirtyDaysLater.toISOString());

  if (error || !allSessions || allSessions.length === 0) {
    logger.info('ℹ️ No hay sesiones de estudio para sincronizar');
    return result;
  }

  logger.info(`📋 Verificando ${allSessions.length} sesiones contra ${calendarEvents.length} eventos del calendario...`);

  // Crear un mapa de eventos del calendario para búsqueda rápida
  const calendarEventIds = new Set(calendarEvents.map(e => e.id));

  // Función para normalizar texto para comparación
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
      .replace(/[^\w\s]/g, '') // Eliminar caracteres especiales
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Función para verificar si un evento del calendario coincide con una sesión
  const findMatchingCalendarEvent = (session: typeof allSessions[0]): CalendarEvent | undefined => {
    // 1. Primero buscar por external_event_id (match exacto)
    if (session.external_event_id && calendarEventIds.has(session.external_event_id)) {
      logger.info(`✅ Match por external_event_id: "${session.title}"`);
      return calendarEvents.find(e => e.id === session.external_event_id);
    }

    // 2. Si no tiene external_event_id, buscar por coincidencia de título y tiempo
    const sessionStart = new Date(session.start_time).getTime();
    const sessionEnd = new Date(session.end_time).getTime();
    const normalizedSessionTitle = normalizeText(session.title);

    // Extraer palabras clave del título de la sesión (primeras palabras significativas)
    const sessionKeywords = normalizedSessionTitle.split(' ').filter(w => w.length > 3).slice(0, 3);

    return calendarEvents.find(event => {
      const normalizedEventTitle = normalizeText(event.title);

      // Verificar coincidencia de título (más flexible)
      // Opción 1: El título de la sesión contiene parte del evento o viceversa
      const directMatch = normalizedEventTitle.includes(normalizedSessionTitle.substring(0, 15)) ||
        normalizedSessionTitle.includes(normalizedEventTitle.substring(0, 15));

      // Opción 2: Comparten palabras clave
      const keywordMatch = sessionKeywords.length > 0 &&
        sessionKeywords.some(kw => normalizedEventTitle.includes(kw));

      // Opción 3: Ambos son sesiones de estudio/lección
      const bothStudySessions = event.isStudySession &&
        (session.title.toLowerCase().includes('lección') ||
          session.title.toLowerCase().includes('leccion'));

      const titleMatch = directMatch || keywordMatch || bothStudySessions;

      // Verificar coincidencia de tiempo (más flexible: dentro de 15 minutos)
      const eventStart = new Date(event.start).getTime();
      const eventEnd = new Date(event.end).getTime();
      const timeMatch = Math.abs(sessionStart - eventStart) < 15 * 60 * 1000 &&
        Math.abs(sessionEnd - eventEnd) < 15 * 60 * 1000;

      // Alternativa: mismo día y hora de inicio similar (dentro de 30 min)
      const sameDayMatch = new Date(session.start_time).toDateString() === new Date(event.start).toDateString() &&
        Math.abs(sessionStart - eventStart) < 30 * 60 * 1000;

      if ((titleMatch && timeMatch) || (titleMatch && sameDayMatch)) {
        logger.info(`✅ Match encontrado para "${session.title}" con evento "${event.title}"`);
        return true;
      }

      return false;
    });
  };

  // IMPORTANTE: Solo eliminar sesiones que tienen external_event_id y ese evento ya no existe
  // Las sesiones sin external_event_id las dejamos intactas (pueden no haberse sincronizado aún)
  // NOTA: Verificar que la sesión esté dentro del rango de eventos consultados antes de eliminar
  for (const session of allSessions) {
    const sessionTime = new Date(session.start_time).getTime();
    const now = new Date().getTime();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    // Solo procesar sesiones que están dentro del rango de eventos que consultamos
    const sessionInCalendarRange = sessionTime >= (now - 7 * 24 * 60 * 60 * 1000) &&
      sessionTime <= (now + thirtyDaysMs);

    // Si tiene external_event_id, verificar que el evento exista
    if (session.external_event_id) {


      if (!calendarEventIds.has(session.external_event_id)) {
        if (!sessionInCalendarRange) {
          // La sesión está fuera del rango de calendario consultado, NO eliminar

          continue;
        }

        // El evento fue eliminado del calendario - eliminar de la BD
        logger.info(`🗑️ [SYNC] Evento "${session.title}" (ID: ${session.external_event_id}) eliminado externamente del calendario`);

        const { error: deleteError } = await supabase
          .from('study_sessions')
          .delete()
          .eq('id', session.id);

        if (!deleteError) {
          result.deletedFromDb.push(session.title);
          logger.info(`✅ Sesión "${session.title}" eliminada de la BD (sincronizado con calendario)`);
        } else {
          logger.error(`❌ Error eliminando sesión: ${deleteError.message}`);
        }
      } else {
      }
    } else {
      // No tiene external_event_id - intentar encontrar un match y vincularlo
      const matchingEvent = findMatchingCalendarEvent(session);

      if (matchingEvent) {
        // Vincular el external_event_id
        await supabase
          .from('study_sessions')
          .update({ external_event_id: matchingEvent.id })
          .eq('id', session.id);
        logger.info(`📝 Vinculado external_event_id "${matchingEvent.id}" a sesión "${session.title}"`);
      } else {
        // No encontramos match, pero NO eliminamos - puede que el calendario no esté sincronizado
        logger.info(`⚠️ Sesión "${session.title}" sin match en calendario - se mantiene (sin external_event_id)`);
      }
    }
  }

  if (result.deletedFromDb.length > 0) {
    result.message = `Se detectó que eliminaste ${result.deletedFromDb.length} sesión(es) de tu calendario: ${result.deletedFromDb.join(', ')}. Las he eliminado también del sistema.`;
    logger.info(`🔄 Sincronización completada: ${result.deletedFromDb.length} sesiones eliminadas`);
  } else {
    logger.info('🔄 Sincronización completada: todas las sesiones están sincronizadas');
  }

  return result;
}

// ============================================================================
// Análisis Proactivo del Calendario y Plan de Estudios
// ============================================================================

interface ProactiveAnalysis {
  conflicts: Array<{
    sessionTitle: string;
    sessionId: string;
    sessionDate: string; // Fecha de la sesión (ej: "miércoles 17 de diciembre de 2025")
    sessionTime: string; // Solo hora (ej: "19:20 - 20:40")
    conflictingEvent: string;
    conflictTime: string;
    suggestedAlternatives: string[];
  }>;
  overloadedDays: Array<{
    date: string;
    totalHours: number;
    events: string[];
    suggestion: string;
  }>;
  missedSessions: Array<{
    sessionTitle: string;
    sessionId: string;
    originalTime: string;
    suggestedRecoverySlots: string[];
  }>;
  overdueSessions: Array<{
    sessionTitle: string;
    sessionId: string;
    scheduledTime: string;
    hoursOverdue: number;
    suggestedRecoverySlots: string[];
  }>;
  freeSlots: Array<{
    date: string;
    startTime: string;
    endTime: string;
    duration: number;
    suggestion: string;
  }>;
  weeklyProgress: {
    plannedMinutes: number;
    completedMinutes: number;
    remainingMinutes: number;
    onTrack: boolean;
    suggestion: string;
  };
  consistencyAlert: {
    daysWithoutStudy: number;
    lastStudyDate: string | null;
    suggestion: string;
  } | null;
  burnoutRisk: {
    level: 'low' | 'medium' | 'high';
    consecutiveHeavyDays: number;
    suggestion: string;
  } | null;
  patterns: {
    frequentRescheduleTime: string | null;
    preferredStudyTime: string | null;
    suggestion: string | null;
  };
}

/**
 * Realiza un análisis proactivo del calendario y plan de estudios
 */
async function analyzeProactively(
  userId: string,
  planId: string,
  sessions: Array<{
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    status: string;
    duration_minutes: number | null;
  }>,
  calendarEvents: CalendarEvent[],
  timezone: string
): Promise<ProactiveAnalysis> {
  const analysis: ProactiveAnalysis = {
    conflicts: [],
    overloadedDays: [],
    missedSessions: [],
    overdueSessions: [],
    freeSlots: [],
    weeklyProgress: {
      plannedMinutes: 0,
      completedMinutes: 0,
      remainingMinutes: 0,
      onTrack: true,
      suggestion: ''
    },
    consistencyAlert: null,
    burnoutRisk: null,
    patterns: {
      frequentRescheduleTime: null,
      preferredStudyTime: null,
      suggestion: null
    }
  };

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  logger.info(`🔍 Iniciando análisis proactivo para ${sessions.length} sesiones y ${calendarEvents.length} eventos`);

  // 1. DETECTAR CONFLICTOS: Sesiones que se empalman con eventos externos
  for (const session of sessions) {
    const sessionStart = new Date(session.start_time).getTime();
    const sessionEnd = new Date(session.end_time).getTime();

    // Logging para debug de horas
    logger.info(`🔍 Sesión "${session.title}": start_time raw = ${session.start_time}`);
    logger.info(`   -> Parsed Date: ${new Date(session.start_time).toISOString()}`);
    logger.info(`   -> formatTime: ${formatTime(new Date(session.start_time))}`);

    // Solo analizar sesiones futuras
    if (sessionStart < now.getTime()) continue;

    for (const event of calendarEvents) {
      // Ignorar si es la misma sesión de estudio
      if (event.isStudySession) continue;

      const eventStart = new Date(event.start).getTime();
      const eventEnd = new Date(event.end).getTime();

      // Verificar si hay solapamiento
      const hasOverlap = (sessionStart < eventEnd) && (sessionEnd > eventStart);

      if (hasOverlap) {
        // Encontrar horarios alternativos (buscar huecos en el mismo día)
        const sessionDate = new Date(session.start_time);
        sessionDate.setHours(0, 0, 0, 0);

        const alternatives = findAlternativeSlots(
          sessionDate,
          session.duration_minutes || 60,
          calendarEvents,
          sessions
        );

        analysis.conflicts.push({
          sessionTitle: session.title,
          sessionId: session.id,
          sessionDate: formatDate(new Date(session.start_time)), // Fecha completa con día de la semana
          sessionTime: `${formatTime(new Date(session.start_time))} - ${formatTime(new Date(session.end_time))}`,
          conflictingEvent: event.title,
          conflictTime: `${formatTime(new Date(event.start))} - ${formatTime(new Date(event.end))}`,
          suggestedAlternatives: alternatives.slice(0, 3)
        });
        break; // Solo reportar el primer conflicto por sesión
      }
    }
  }

  // 2. DETECTAR DÍAS SOBRECARGADOS
  const dayLoadMap = new Map<string, { totalMinutes: number; events: string[] }>();

  // Contar eventos externos
  for (const event of calendarEvents) {
    if (event.isAllDay) continue;

    const eventDate = new Date(event.start);
    eventDate.setHours(0, 0, 0, 0);
    const dateKey = eventDate.toISOString().split('T')[0];

    const duration = (new Date(event.end).getTime() - new Date(event.start).getTime()) / (1000 * 60);

    const existing = dayLoadMap.get(dateKey) || { totalMinutes: 0, events: [] };
    existing.totalMinutes += duration;
    existing.events.push(event.title);
    dayLoadMap.set(dateKey, existing);
  }

  // Contar sesiones de estudio
  for (const session of sessions) {
    const sessionDate = new Date(session.start_time);
    sessionDate.setHours(0, 0, 0, 0);
    const dateKey = sessionDate.toISOString().split('T')[0];

    const duration = session.duration_minutes || 60;

    const existing = dayLoadMap.get(dateKey) || { totalMinutes: 0, events: [] };
    existing.totalMinutes += duration;
    existing.events.push(`📚 ${session.title}`);
    dayLoadMap.set(dateKey, existing);
  }

  // Identificar días con más de 8 horas de actividad
  let consecutiveHeavyDays = 0;
  for (const [dateKey, load] of dayLoadMap) {
    const hours = load.totalMinutes / 60;
    if (hours > 8) {
      analysis.overloadedDays.push({
        date: dateKey,
        totalHours: Math.round(hours * 10) / 10,
        events: load.events,
        suggestion: hours > 10
          ? 'Día muy saturado. Considera mover alguna sesión de estudio o reducir su duración.'
          : 'Día cargado. Asegúrate de tener descansos entre actividades.'
      });
      consecutiveHeavyDays++;
    } else {
      consecutiveHeavyDays = 0;
    }
  }

  // Alerta de burnout
  if (consecutiveHeavyDays >= 3) {
    analysis.burnoutRisk = {
      level: consecutiveHeavyDays >= 5 ? 'high' : 'medium',
      consecutiveHeavyDays,
      suggestion: `Llevas ${consecutiveHeavyDays} días muy cargados seguidos. Considera tomarte un descanso o reducir la carga.`
    };
  }

  // 3. DETECTAR SESIONES PERDIDAS
  for (const session of sessions) {
    if (session.status === 'missed') {
      const sessionDate = new Date(session.start_time);
      const recoverySlots = findAlternativeSlots(
        new Date(),
        session.duration_minutes || 60,
        calendarEvents,
        sessions
      );

      analysis.missedSessions.push({
        sessionTitle: session.title,
        sessionId: session.id,
        originalTime: formatDateTime(sessionDate),
        suggestedRecoverySlots: recoverySlots.slice(0, 3)
      });
    }
  }

  // 3.5. DETECTAR SESIONES NO REALIZADAS (planificadas en el pasado pero no completadas)
  for (const session of sessions) {
    // Solo considerar sesiones que están planificadas y cuya hora de fin ya pasó
    if (session.status === 'planned') {
      const sessionEndTime = new Date(session.end_time);
      const hoursOverdue = (now.getTime() - sessionEndTime.getTime()) / (1000 * 60 * 60);

      // Si la sesión terminó hace más de 1 hora y sigue como 'planned', es una sesión no realizada
      if (hoursOverdue > 1) {
        const recoverySlots = findAlternativeSlots(
          new Date(),
          session.duration_minutes || 60,
          calendarEvents,
          sessions
        );

        analysis.overdueSessions.push({
          sessionTitle: session.title,
          sessionId: session.id,
          scheduledTime: formatDateTime(new Date(session.start_time)),
          hoursOverdue: Math.round(hoursOverdue),
          suggestedRecoverySlots: recoverySlots.slice(0, 3)
        });
      }
    }
  }

  // 4. DETECTAR HUECOS LIBRES (para sugerir micro-sesiones)
  const next7Days = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(todayStart);
    date.setDate(date.getDate() + i);
    next7Days.push(date);
  }

  for (const day of next7Days) {
    const dayStart = new Date(day);
    dayStart.setHours(8, 0, 0, 0); // Empezar a las 8am

    const dayEnd = new Date(day);
    dayEnd.setHours(22, 0, 0, 0); // Terminar a las 10pm

    const dateKey = day.toISOString().split('T')[0];

    // Obtener eventos de ese día ordenados
    const dayEvents = [...calendarEvents, ...sessions.map(s => ({
      start: s.start_time,
      end: s.end_time,
      title: s.title
    }))]
      .filter(e => new Date(e.start).toISOString().split('T')[0] === dateKey)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    // Buscar huecos de al menos 15 minutos
    let lastEnd = dayStart.getTime();
    for (const event of dayEvents) {
      const eventStart = new Date(event.start).getTime();
      const gap = (eventStart - lastEnd) / (1000 * 60); // minutos

      if (gap >= 15 && gap <= 45) { // Huecos pequeños ideales para micro-sesiones
        analysis.freeSlots.push({
          date: dateKey,
          startTime: formatTime(new Date(lastEnd)),
          endTime: formatTime(new Date(eventStart)),
          duration: Math.round(gap),
          suggestion: gap < 20
            ? 'Ideal para repasar flashcards o hacer una lectura rápida.'
            : 'Puedes hacer una micro-sesión de estudio enfocado.'
        });
      }

      lastEnd = Math.max(lastEnd, new Date(event.end).getTime());
    }
  }

  // 5. CALCULAR PROGRESO SEMANAL
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Inicio de semana (domingo)

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  for (const session of sessions) {
    const sessionDate = new Date(session.start_time);
    if (sessionDate >= weekStart && sessionDate < weekEnd) {
      analysis.weeklyProgress.plannedMinutes += session.duration_minutes || 60;
      if (session.status === 'completed') {
        analysis.weeklyProgress.completedMinutes += session.duration_minutes || 60;
      } else if (sessionDate < now) {
        // Sesión pasada no completada
        analysis.weeklyProgress.remainingMinutes += session.duration_minutes || 60;
      }
    }
  }

  const completionRate = analysis.weeklyProgress.plannedMinutes > 0
    ? analysis.weeklyProgress.completedMinutes / analysis.weeklyProgress.plannedMinutes
    : 0;

  analysis.weeklyProgress.onTrack = completionRate >= 0.7;

  if (!analysis.weeklyProgress.onTrack && analysis.weeklyProgress.remainingMinutes > 0) {
    analysis.weeklyProgress.suggestion = `Vas atrasado esta semana. Te faltan ${Math.round(analysis.weeklyProgress.remainingMinutes / 60)} horas de estudio. ¿Quieres que redistribuya las sesiones restantes?`;
  }

  // 6. ALERTA DE CONSISTENCIA (días sin estudiar)
  const sortedSessions = [...sessions].sort((a, b) =>
    new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
  );

  const lastCompletedSession = sortedSessions.find(s => s.status === 'completed');
  if (lastCompletedSession) {
    const lastStudyDate = new Date(lastCompletedSession.start_time);
    const daysSinceStudy = Math.floor((now.getTime() - lastStudyDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceStudy >= 3) {
      analysis.consistencyAlert = {
        daysWithoutStudy: daysSinceStudy,
        lastStudyDate: formatDate(lastStudyDate),
        suggestion: daysSinceStudy >= 7
          ? `Llevas ${daysSinceStudy} días sin estudiar. ¿Te gustaría retomar con una sesión corta de 15-20 minutos?`
          : `Han pasado ${daysSinceStudy} días desde tu última sesión. ¡Es buen momento para retomar!`
      };
    }
  }

  logger.info(`🔍 Análisis completado: ${analysis.conflicts.length} conflictos, ${analysis.overloadedDays.length} días sobrecargados, ${analysis.missedSessions.length} sesiones perdidas, ${analysis.overdueSessions.length} sesiones no realizadas`);

  return analysis;
}

/**
 * Encuentra horarios alternativos para una sesión
 * Verifica contra TODOS los eventos del calendario (no solo sesiones de estudio)
 */
function findAlternativeSlots(
  date: Date,
  durationMinutes: number,
  calendarEvents: CalendarEvent[],
  sessions: Array<{ start_time: string; end_time: string }>
): string[] {
  const alternatives: string[] = [];
  const now = new Date();

  // Horarios preferidos para estudiar (hora de inicio)
  const preferredHours = [7, 8, 9, 10, 12, 13, 14, 17, 18, 19, 20, 21];

  // Calcular duración en horas (redondeado hacia arriba)
  const durationHours = Math.ceil(durationMinutes / 60);

  // Función auxiliar para obtener la clave de fecha en formato local
  const getDateKey = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Función para verificar si un slot tiene conflicto con eventos
  const hasConflict = (slotStart: Date, slotEnd: Date, events: Array<{ start: string; end: string }>): boolean => {
    return events.some(event => {
      const eventStart = new Date(event.start).getTime();
      const eventEnd = new Date(event.end).getTime();
      const slotStartTime = slotStart.getTime();
      const slotEndTime = slotEnd.getTime();

      // Hay conflicto si los rangos se superponen
      return (slotStartTime < eventEnd) && (slotEndTime > eventStart);
    });
  };

  // Buscar en los próximos 14 días
  for (let dayOffset = 0; dayOffset <= 14 && alternatives.length < 3; dayOffset++) {
    const checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() + dayOffset);
    checkDate.setHours(0, 0, 0, 0);

    const dateKey = getDateKey(checkDate);

    // Obtener TODOS los eventos de este día (calendario externo + sesiones de estudio)
    const allDayEvents: Array<{ start: string; end: string }> = [];

    // Agregar eventos del calendario externo
    for (const event of calendarEvents) {
      const eventDateKey = getDateKey(new Date(event.start));
      if (eventDateKey === dateKey) {
        allDayEvents.push({ start: event.start, end: event.end });
      }
    }

    // Agregar sesiones de estudio existentes
    for (const session of sessions) {
      const sessionDateKey = getDateKey(new Date(session.start_time));
      if (sessionDateKey === dateKey) {
        allDayEvents.push({ start: session.start_time, end: session.end_time });
      }
    }

    // Log para debug (solo en desarrollo)
    if (allDayEvents.length > 0) {
      logger.info(`📅 Día ${dateKey}: ${allDayEvents.length} eventos encontrados`);
    }

    // Probar cada hora preferida
    for (const hour of preferredHours) {
      if (alternatives.length >= 3) break;

      const slotStart = new Date(checkDate);
      slotStart.setHours(hour, 0, 0, 0);

      const slotEnd = new Date(checkDate);
      slotEnd.setHours(hour + durationHours, 0, 0, 0);

      // Saltar si el slot ya pasó
      if (slotStart.getTime() < now.getTime()) {
        continue;
      }

      // Verificar si hay conflicto con algún evento
      if (!hasConflict(slotStart, slotEnd, allDayEvents)) {
        // Formatear con día de la semana para mayor claridad
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const dayName = dayNames[slotStart.getDay()];
        const dateStr = formatDate(slotStart);

        alternatives.push(`${dayName} ${dateStr}, ${formatTime(slotStart)} - ${formatTime(slotEnd)}`);
        logger.info(`✅ Slot libre encontrado: ${dayName} ${dateStr} ${formatTime(slotStart)}`);
      }
    }
  }

  // Si no encontramos alternativas, dar un mensaje genérico
  if (alternatives.length === 0) {
    alternatives.push('Revisa tu calendario para encontrar un horario libre');
  }

  return alternatives;
}

function formatDateTime(date: Date): string {
  return `${formatDate(date)} a las ${formatTime(date)}`;
}

// ============================================================================
// Función para obtener el contexto del plan y eventos del calendario
// ============================================================================

async function getPlanContext(userId: string, planId?: string): Promise<{ context: string; syncResult?: SyncResult; timezone: string }> {
  const supabase = createAdminClient();

  logger.info(`🔍 getPlanContext - userId: ${userId}, planId: ${planId || 'no especificado'}`);

  // Obtener plan más reciente (la tabla no tiene columna status)
  let planQuery = supabase
    .from('study_plans')
    .select(`
      id,
      name,
      description,
      start_date,
      end_date,
      timezone,
      preferred_days
    `)
    .eq('user_id', userId);

  if (planId) {
    planQuery = planQuery.eq('id', planId);
  } else {
    // Si no hay planId específico, ordenar por fecha de creación y tomar el más reciente
    planQuery = planQuery.order('created_at', { ascending: false }).limit(1);
  }

  const { data: plan, error: planError } = await planQuery.single();

  const timezone = plan?.timezone || 'America/Mexico_City';

  // Obtener fechas para consultas
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date(todayStart);
  todayEnd.setHours(23, 59, 59, 999);

  // Ampliar rango: 7 días atrás y 30 días adelante para capturar más sesiones
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);


  // Obtener eventos del calendario
  let calendarEventsToday: CalendarEvent[] = [];
  let calendarEventsWeek: CalendarEvent[] = [];
  let calendarEventsTwoWeeks: CalendarEvent[] = [];
  let syncResult: SyncResult | undefined;

  const { accessToken, provider } = await getCalendarAccessToken(userId);

  logger.info(`🔑 Calendar token: ${accessToken ? 'SÍ' : 'NO'}, provider: ${provider}`);

  // Obtener lista de calendarios disponibles y selección actual para el contexto de LIA
  let calendarListContext = '';
  if (accessToken && provider) {
    try {
      const selectedIds = await CalendarIntegrationService.getSelectedCalendarIds(userId);

      if (provider === 'google') {
        const googleCals = await CalendarIntegrationService.getGoogleCalendarList(accessToken);
        if (googleCals.length > 0) {
          calendarListContext = `\n## 📋 CALENDARIOS DISPONIBLES DEL USUARIO (Google)\n`;
          calendarListContext += `Selección actual: ${selectedIds ? selectedIds.join(', ') : 'solo principal (sin configurar)'}\n`;
          for (const cal of googleCals) {
            const isSelected = selectedIds ? selectedIds.includes(cal.id) : cal.primary;
            calendarListContext += `- ${isSelected ? '✅' : '⬜'} "${cal.summary}" (ID: ${cal.id})${cal.primary ? ' [PRINCIPAL]' : ''}\n`;
          }
          calendarListContext += `\nEl usuario puede pedirte que cambies qué calendarios se consideran para su disponibilidad. Usa la acción update_calendar_selection con los IDs deseados. SIEMPRE debe quedar al menos 1 calendario seleccionado.\n`;
        }
      } else {
        const msCals = await CalendarIntegrationService.getMicrosoftCalendarList(accessToken);
        if (msCals.length > 0) {
          calendarListContext = `\n## 📋 CALENDARIOS DISPONIBLES DEL USUARIO (Microsoft)\n`;
          calendarListContext += `Selección actual: ${selectedIds ? selectedIds.join(', ') : 'solo principal (sin configurar)'}\n`;
          for (const cal of msCals) {
            const isSelected = selectedIds ? selectedIds.includes(cal.id) : cal.isDefaultCalendar;
            calendarListContext += `- ${isSelected ? '✅' : '⬜'} "${cal.name}" (ID: ${cal.id})${cal.isDefaultCalendar ? ' [PRINCIPAL]' : ''}\n`;
          }
          calendarListContext += `\nEl usuario puede pedirte que cambies qué calendarios se consideran para su disponibilidad. Usa la acción update_calendar_selection con los IDs deseados. SIEMPRE debe quedar al menos 1 calendario seleccionado.\n`;
        }
      }
    } catch (calListError) {
      logger.warn('⚠️ No se pudo obtener lista de calendarios para contexto:', calListError);
    }
  }

  if (accessToken && provider === 'google') {
    // PRIMERO: Obtener eventos del calendario para las próximas 2 semanas
    logger.info(`📅 Consultando eventos de hoy: ${todayStart.toISOString()} - ${todayEnd.toISOString()}`);
    calendarEventsToday = await listGoogleCalendarEvents(accessToken, todayStart, todayEnd, timezone);
    logger.info(`📅 Eventos de hoy encontrados: ${calendarEventsToday.length}`);

    // Eventos de la semana (7 días)
    const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    calendarEventsWeek = await listGoogleCalendarEvents(accessToken, todayStart, weekEnd, timezone);
    logger.info(`📅 Eventos de la semana encontrados: ${calendarEventsWeek.length}`);

    // Eventos de 30 días (para sincronización)
    calendarEventsTwoWeeks = await listGoogleCalendarEvents(accessToken, todayStart, thirtyDaysLater, timezone);
    logger.info(`📅 Eventos de 30 días encontrados: ${calendarEventsTwoWeeks.length}`);

    // AHORA: Sincronizar sesiones con el calendario (detectar eliminaciones)
    if (plan) {
      syncResult = await syncSessionsWithCalendar(userId, plan.id, accessToken, calendarEventsTwoWeeks);
    }
  } else {
    logger.warn(`⚠️ No se pudo obtener acceso al calendario`);
  }

  let context = '';

  // Agregar info de calendarios disponibles y selección
  if (calendarListContext) {
    context += calendarListContext + '\n';
  }

  // Si se detectaron eliminaciones, agregar alerta al contexto
  if (syncResult && syncResult.deletedFromDb.length > 0) {
    context += `## ⚠️ CAMBIOS DETECTADOS EN EL CALENDARIO
Se detectó que el usuario eliminó ${syncResult.deletedFromDb.length} sesión(es) directamente del calendario de Google:
${syncResult.deletedFromDb.map(s => `- "${s}"`).join('\n')}

**IMPORTANTE:** Estas sesiones han sido eliminadas automáticamente del sistema.
Debes mencionar esto al usuario de forma proactiva y preguntarle:
1. ¿Por qué decidió eliminar esas sesiones?
2. ¿Quiere reprogramarlas para otro horario?
3. ¿Necesita ajustar su plan de estudios?

`;
  }

  // Sección de calendario
  context += `## 📅 EVENTOS DEL CALENDARIO EXTERNO - HOY (Google Calendar)
`;

  if (calendarEventsToday.length > 0) {
    for (const event of calendarEventsToday) {
      const typeLabel = event.isStudySession ? '📚' : '📌';
      const timeStr = event.isAllDay ? 'Todo el día' : `${formatTime(new Date(event.start))} - ${formatTime(new Date(event.end))}`;
      context += `- ${typeLabel} **${event.title}** (${timeStr}) [ID: ${event.id}]
`;
    }
  } else {
    context += '⚠️ No hay eventos programados para hoy en Google Calendar.\n';
  }

  if (!plan) {
    context += '\n⚠️ El usuario NO tiene un plan de estudios activo.';
    return { context, syncResult: undefined, timezone: 'America/Mexico_City' };
  }

  // Obtener sesiones del plan - CONSULTA DIRECTA A LA BD (sin caché)

  // Primero: Consultar TODAS las sesiones del plan para diagnóstico
  const { data: allSessions, error: allSessionsError } = await supabase
    .from('study_sessions')
    .select('id, title, start_time, status, external_event_id')
    .eq('plan_id', plan.id);

  if (allSessions && allSessions.length > 0) {

    allSessions.forEach(s => {

    });
  } else {
    console.warn(`⚠️ [CHAT DEBUG] No hay NINGUNA sesión en el plan ${plan.id}`);
  }

  const { data: sessions, error: sessionsError } = await supabase
    .from('study_sessions')
    .select(`
      id,
      title,
      description,
      start_time,
      end_time,
      duration_minutes,
      status,
      course_id,
      lesson_id
    `)
    .eq('plan_id', plan.id)
    .gte('start_time', oneWeekAgo.toISOString())
    .lte('start_time', thirtyDaysLater.toISOString())
    .order('start_time', { ascending: true });

  if (sessions && sessions.length > 0) {
  } else if (allSessions && allSessions.length > 0) {
    logger.warn(`⚠️ Hay sesiones pero están fuera del rango de fechas ${oneWeekAgo.toISOString()} - ${thirtyDaysLater.toISOString()}`);
  }

  // Formatear contexto del plan
  context += `
## 📚 PLAN DE ESTUDIOS ACTIVO
- **Nombre:** ${plan.name}
- **Descripción:** ${plan.description || 'Sin descripción'}
- **Zona horaria:** ${plan.timezone}
- **Días preferidos:** ${formatPreferredDays(plan.preferred_days)}

## SESIONES DE ESTUDIO PRÓXIMAS (consulta en tiempo real a la BD)
`;

  if (sessions && sessions.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    for (const session of sessions) {
      const sessionIdx = sessions.indexOf(session);
      const startDate = new Date(session.start_time);
      const endDate = new Date(session.end_time);

      const sessionDay = new Date(startDate);
      sessionDay.setHours(0, 0, 0, 0);

      let dayLabel = '';
      if (sessionDay.getTime() === today.getTime()) {
        dayLabel = ' 📍 **[HOY]**';
      } else if (sessionDay.getTime() === tomorrow.getTime()) {
        dayLabel = ' 📅 **[MAÑANA]**';
      }

      context += `
${sessionIdx + 1}. **${session.title}**${dayLabel}
   - ID: ${session.id}
   - Fecha: ${formatDate(startDate)}
   - Hora: ${formatTime(startDate)} - ${formatTime(endDate)}
   - Duración: ${session.duration_minutes || 'N/A'} minutos
   - Estado: ${translateStatus(session.status)}
`;
    }

    context += `
**TOTAL: ${sessions.length} sesiones de estudio programadas.**
`;
  } else {
    context += `
⚠️ **IMPORTANTE: NO HAY SESIONES DE ESTUDIO PROGRAMADAS.**
El usuario NO tiene ninguna sesión de estudio en los próximos 14 días.
Si el usuario pregunta por sus lecciones o sesiones, debes informarle que no tiene ninguna.
Sé proactiva y pregunta si quiere crear un nuevo plan o si eliminó las sesiones intencionalmente.
`;
  }

  // Agregar otros eventos de la semana (no sesiones de estudio)
  const otherEvents = calendarEventsWeek.filter(e => !e.isStudySession);
  if (otherEvents.length > 0) {
    context += `

## 📌 OTROS EVENTOS DE LA SEMANA (no son sesiones de estudio)
`;
    for (const event of otherEvents.slice(0, 10)) { // Limitar a 10 eventos
      const eventDate = new Date(event.start);
      const timeStr = event.isAllDay ? 'Todo el día' : `${formatTime(eventDate)}`;
      context += `- **${event.title}** - ${formatDate(eventDate)} ${timeStr} [ID: ${event.id}]
`;
    }
  }

  // =========================================================================
  // ANÁLISIS PROACTIVO - Inteligencia para detectar conflictos y oportunidades
  // =========================================================================
  if (sessions && sessions.length > 0 && calendarEventsTwoWeeks.length > 0) {
    const proactiveAnalysis = await analyzeProactively(
      userId,
      plan.id,
      sessions,
      calendarEventsTwoWeeks,
      timezone
    );

    // Agregar sección de análisis proactivo al contexto
    context += `

## 🧠 ANÁLISIS PROACTIVO DE TU PLAN
`;

    // 1. CONFLICTOS DETECTADOS
    if (proactiveAnalysis.conflicts.length > 0) {
      context += `
### ⚠️ CONFLICTOS DETECTADOS
Se han detectado **${proactiveAnalysis.conflicts.length} conflicto(s)** entre sesiones de estudio y otros eventos:
`;
      for (const conflict of proactiveAnalysis.conflicts) {
        context += `
- **${conflict.sessionTitle}** programada para el **${conflict.sessionDate}** de ${conflict.sessionTime}, CONFLICTA con "${conflict.conflictingEvent}" (${conflict.conflictTime})
  - Alternativas sugeridas: ${conflict.suggestedAlternatives.join(' | ') || 'No hay alternativas disponibles'}
`;
      }
      context += `
**ACCIÓN REQUERIDA:** Debes informar al usuario sobre estos conflictos CON LA FECHA CORRECTA y ofrecer reprogramar las sesiones.
`;
    }

    // 2. DÍAS SOBRECARGADOS
    if (proactiveAnalysis.overloadedDays.length > 0) {
      context += `
### 📊 DÍAS SOBRECARGADOS
`;
      for (const day of proactiveAnalysis.overloadedDays.slice(0, 3)) {
        context += `- **${day.date}**: ${day.totalHours}h de actividad - ${day.suggestion}
`;
      }
    }

    // 3. RIESGO DE BURNOUT
    if (proactiveAnalysis.burnoutRisk) {
      context += `
### 🔴 ALERTA DE SOBRECARGA
- Nivel: **${proactiveAnalysis.burnoutRisk.level.toUpperCase()}**
- ${proactiveAnalysis.burnoutRisk.suggestion}
**IMPORTANTE:** Sugiere al usuario tomar un descanso o reducir la carga de estudio.
`;
    }

    // 4. SESIONES PERDIDAS
    if (proactiveAnalysis.missedSessions.length > 0) {
      context += `
### 📌 SESIONES PERDIDAS QUE REQUIEREN RECUPERACIÓN
`;
      for (const missed of proactiveAnalysis.missedSessions) {
        context += `- **${missed.sessionTitle}** (original: ${missed.originalTime})
  - Horarios sugeridos para recuperar: ${missed.suggestedRecoverySlots.join(' | ') || 'Buscar horario libre'}
`;
      }
      context += `
**ACCIÓN:** Pregunta al usuario si quiere reprogramar estas sesiones perdidas.
`;
    }

    // 4.5. SESIONES NO REALIZADAS (planificadas que ya pasaron)
    if (proactiveAnalysis.overdueSessions.length > 0) {
      context += `
### ⚠️ SESIONES NO REALIZADAS
Estas sesiones estaban planificadas pero no se completaron:
`;
      for (const overdue of proactiveAnalysis.overdueSessions) {
        const hoursText = overdue.hoursOverdue >= 24
          ? `hace ${Math.floor(overdue.hoursOverdue / 24)} día(s)`
          : `hace ${overdue.hoursOverdue}h`;
        context += `- **${overdue.sessionTitle}** (programada: ${overdue.scheduledTime}, ${hoursText})
  - Horarios sugeridos para recuperar: ${overdue.suggestedRecoverySlots.join(' | ') || 'Buscar horario libre'}
`;
      }
      context += `
**ACCIÓN:** Pregunta al usuario con empatía qué pasó con estas sesiones. Ofrece ayuda para:
1. Reprogramarlas a un nuevo horario
2. Marcarlas como completadas si ya las hizo
3. Eliminarlas si ya no son relevantes
Sé comprensivo - a veces la vida se interpone. Ayuda al usuario a retomar el ritmo sin juzgar.
`;
    }

    // 5. PROGRESO SEMANAL
    context += `
### 📈 PROGRESO SEMANAL
- Planificado: ${Math.round(proactiveAnalysis.weeklyProgress.plannedMinutes / 60)}h
- Completado: ${Math.round(proactiveAnalysis.weeklyProgress.completedMinutes / 60)}h
- Estado: ${proactiveAnalysis.weeklyProgress.onTrack ? '✅ En camino' : '⚠️ Atrasado'}
`;
    if (proactiveAnalysis.weeklyProgress.suggestion) {
      context += `- ${proactiveAnalysis.weeklyProgress.suggestion}
`;
    }

    // 6. ALERTA DE CONSISTENCIA
    if (proactiveAnalysis.consistencyAlert) {
      context += `
### ⏰ ALERTA DE CONSISTENCIA
- Días sin estudiar: **${proactiveAnalysis.consistencyAlert.daysWithoutStudy}**
- Última sesión: ${proactiveAnalysis.consistencyAlert.lastStudyDate}
- ${proactiveAnalysis.consistencyAlert.suggestion}
`;
    }

    // 7. HUECOS LIBRES PARA MICRO-SESIONES
    if (proactiveAnalysis.freeSlots.length > 0) {
      context += `
### 💡 VENTANAS LIBRES PARA MICRO-SESIONES
`;
      for (const slot of proactiveAnalysis.freeSlots.slice(0, 5)) {
        context += `- **${slot.date}** ${slot.startTime} - ${slot.endTime} (${slot.duration} min) - ${slot.suggestion}
`;
      }
    }

    context += `
---
**INSTRUCCIONES PARA LIA:**
1. Si hay conflictos, PRIMERO menciónalos y ofrece soluciones con las alternativas sugeridas
2. Si hay días sobrecargados o riesgo de burnout, sugiere reducir la carga
3. Si hay sesiones perdidas, ofrece reprogramarlas
4. Si hay sesiones NO REALIZADAS (planificadas que ya pasaron), pregunta con empatía qué sucedió y ofrece ayuda para reprogramar, marcar como completadas o eliminar
5. Si el progreso semanal está atrasado, ofrece rebalancear el plan
6. Si hay huecos libres, sugiere micro-sesiones de repaso
7. Siempre sé proactiva y empática con el usuario - no juzgues si no completó sesiones
`;
  }

  return { context, syncResult, timezone };
}

// Variable para almacenar el timezone del usuario actual (se establece en cada request)
let currentTimezone = 'America/Mexico_City'; // Default: México

// Función para establecer el timezone del request actual
function setCurrentTimezone(tz: string) {
  currentTimezone = tz || 'America/Mexico_City';
}

// Función para obtener el offset de zona horaria (ej: "-06:00" para México, "-05:00" para Colombia)
function getTimezoneOffset(timezone: string): string {
  const timezoneOffsets: Record<string, string> = {
    'America/Mexico_City': '-06:00',
    'America/Bogota': '-05:00',
    'America/New_York': '-05:00',
    'America/Los_Angeles': '-08:00',
    'America/Chicago': '-06:00',
    'America/Denver': '-07:00',
    'America/Sao_Paulo': '-03:00',
    'America/Buenos_Aires': '-03:00',
    'America/Lima': '-05:00',
    'America/Santiago': '-03:00',
    'Europe/Madrid': '+01:00',
    'Europe/London': '+00:00',
    'UTC': '+00:00',
  };
  return timezoneOffsets[timezone] || '-06:00'; // Default México
}

// Funciones helper de formateo
function formatPreferredDays(days: number[]): string {
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return days.map(d => dayNames[d]).join(', ');
}

function formatDate(date: Date, timezone?: string): string {
  const tz = timezone || currentTimezone;
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: tz
  };
  return date.toLocaleDateString('es-MX', options);
}

function formatTime(date: Date, timezone?: string): string {
  const tz = timezone || currentTimezone;
  return date.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: tz
  });
}

function translateStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'planned': 'Planificada',
    'in_progress': 'En progreso',
    'completed': 'Completada',
    'missed': 'Perdida',
    'rescheduled': 'Reprogramada',
  };
  return statusMap[status] || status;
}

// Función para extraer acción(es) del mensaje de LIA
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

// ============================================================================
// Funciones de sincronización con calendario externo
// ============================================================================

/**
 * Obtiene el access token válido del usuario para el calendario
 */
async function getCalendarAccessToken(userId: string): Promise<{
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
async function refreshAccessToken(integration: any): Promise<{ success: boolean; accessToken?: string }> {
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

/**
 * Actualiza un evento en Google Calendar
 * IMPORTANTE: Usa el calendario secundario de la plataforma si está disponible
 */
async function updateGoogleCalendarEvent(
  accessToken: string,
  eventId: string,
  session: { title: string; start_time: string; end_time: string; description?: string },
  timezone: string,
  calendarId: string | null = null
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
async function deleteGoogleCalendarEvent(
  accessToken: string,
  eventId: string,
  calendarId: string | null = null
): Promise<boolean> {
  try {
    const targetCalendarId = calendarId || 'primary';
    logger.info(`🗑️ Eliminando evento de Google Calendar: ${eventId} (calendario: ${targetCalendarId === 'primary' ? 'principal' : 'secundario'})`);

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

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
async function createGoogleCalendarEvent(
  accessToken: string,
  session: { title: string; start_time: string; end_time: string; description?: string },
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
 * Listar eventos del Google Calendar
 * IMPORTANTE: Consulta TODOS los calendarios del usuario para detectar conflictos
 */
interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  isAllDay: boolean;
  isStudySession: boolean;
}

async function listGoogleCalendarEvents(
  accessToken: string,
  startDate: Date,
  endDate: Date,
  timezone: string
): Promise<CalendarEvent[]> {
  try {
    logger.info(`📅 Obteniendo eventos de TODOS los calendarios de Google Calendar: ${startDate.toISOString()} - ${endDate.toISOString()}`);

    // Usar el servicio centralizado que consulta todos los calendarios
    const events = await CalendarIntegrationService.getGoogleCalendarEvents(accessToken, startDate, endDate);

    // Transformar al formato esperado
    return events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      start: event.startTime,
      end: event.endTime,
      isAllDay: event.isAllDay,
      // Determinar si es una sesión de estudio (creada por nuestra app)
      isStudySession: (event.title?.includes('📚') || event.description?.includes('Aprende y Aplica')) ?? false,
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
async function moveGoogleCalendarEvent(
  accessToken: string,
  eventId: string,
  newStart: string,
  newEnd: string,
  timezone: string,
  calendarId: string | null = null
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
async function syncSessionWithCalendar(
  userId: string,
  sessionId: string,
  action: 'update' | 'delete',
  newData?: { start_time: string; end_time: string }
): Promise<{ success: boolean; message?: string }> {
  const supabase = createAdminClient();

  logger.info(`🔄 syncSessionWithCalendar iniciado - sessionId: ${sessionId}, action: ${action}`);

  // Obtener la sesión con su external_event_id
  const { data: session, error: sessionError } = await supabase
    .from('study_sessions')
    .select('id, title, description, start_time, end_time, external_event_id, plan_id')
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
      const success = await deleteGoogleCalendarEvent(accessToken, session.external_event_id, calendarId);
      return { success, message: success ? 'Evento eliminado del calendario' : 'Error eliminando del calendario' };
    } else if (action === 'update' && newData) {
      const success = await updateGoogleCalendarEvent(
        accessToken,
        session.external_event_id,
        {
          title: session.title,
          description: session.description || '',
          start_time: newData.start_time,
          end_time: newData.end_time,
        },
        timezone,
        calendarId
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
        const { error: updateError } = await supabase
          .from('study_sessions')
          .update({
            external_event_id: eventId,
            calendar_provider: 'google',
          })
          .eq('id', sessionId);

        if (updateError) {
          logger.error('❌ Error guardando external_event_id:', updateError);
        } else {
          logger.info(`✅ external_event_id guardado en sesión: ${eventId}`);
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

// ============================================================================
// Función para ejecutar acciones
// ============================================================================

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

      const tzOffset = getTimezoneOffset(currentTimezone);

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

      const events = await listGoogleCalendarEvents(accessToken, start, end, currentTimezone || 'America/Mexico_City');

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
        currentTimezone || 'America/Mexico_City',
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
        currentTimezone || 'America/Mexico_City',
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
          currentTimezone || 'America/Mexico_City',
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
            currentTimezone || 'America/Mexico_City',
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
