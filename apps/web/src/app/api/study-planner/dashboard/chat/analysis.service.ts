/**
 * Analysis Service
 * Handles bidirectional calendar sync and proactive plan analysis.
 */

import { logger } from '../../../../../lib/utils/logger';
import { createAdminClient } from './calendar.service';
import { formatDate, formatTime, formatDateTime } from './format.utils';
import type { CalendarEvent, SyncResult, ProactiveAnalysis } from './types';

/**
 * Sincroniza las sesiones de la BD con el calendario de Google.
 * Compara las sesiones de estudio en la BD contra los eventos del calendario:
 * 1. Si una sesión tiene external_event_id y el evento no existe → eliminar de BD
 * 2. Si una sesión NO tiene external_event_id, buscar por título/hora en el calendario
 *    - Si no se encuentra en el calendario → eliminar de BD (fue eliminada externamente)
 */
export async function syncSessionsWithCalendar(
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
    const nowMs = new Date().getTime();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    // Solo procesar sesiones que están dentro del rango de eventos que consultamos
    const sessionInCalendarRange = sessionTime >= (nowMs - 7 * 24 * 60 * 60 * 1000) &&
      sessionTime <= (nowMs + thirtyDaysMs);

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

/**
 * Realiza un análisis proactivo del calendario y plan de estudios
 */
export async function analyzeProactively(
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
export function findAlternativeSlots(
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
