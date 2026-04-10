/**
 * Context Service
 * Handles plan context retrieval using calendar and analysis services.
 */

import { logger } from '../../../../../lib/utils/logger';
import { CalendarIntegrationService } from '../../../../../features/study-planner/services/calendar-integration.service';
import { createAdminClient, getCalendarAccessToken, listGoogleCalendarEvents } from './calendar.service';
import { syncSessionsWithCalendar, analyzeProactively, isWorkBlockEvent } from './analysis.service';
import {
  formatDate,
  formatTime,
  formatPreferredDays,
  translateStatus,
} from './format.utils';
import type { SyncResult, CalendarEvent } from './types';
import {
  normalizeCalendarEventId,
  parseSessionMetrics,
  resolveSessionCalendarSync,
} from './calendar.service';

interface SessionPlannedLesson {
  lessonId?: string;
  lessonTitle?: string;
  courseId?: string;
  courseTitle?: string;
  durationMinutes?: number;
}

interface SessionMetricsPayload {
  plannedLessonTitles?: string[];
  plannedLessons?: SessionPlannedLesson[];
  calendarSync?: {
    provider?: string;
    calendarId?: string | null;
    externalEventId?: string;
    normalizedExternalEventId?: string;
    source?: string;
    lastSyncedAt?: string;
  } | null;
}

function getSessionLessonSummary(
  sessionTitle: string,
  metrics: unknown,
): { lessonTitles: string[]; totalMinutes: number | null } {
  const parsedMetrics = parseSessionMetrics(metrics);
  const plannedLessons = parsedMetrics?.plannedLessons || [];
  const plannedLessonTitles = parsedMetrics?.plannedLessonTitles || [];

  const lessonTitles = Array.from(
    new Set([
      ...plannedLessons
        .map((lesson) => lesson.lessonTitle?.trim())
        .filter((value): value is string => Boolean(value)),
      ...plannedLessonTitles
        .map((title) => title?.trim())
        .filter((value): value is string => Boolean(value)),
    ]),
  ).filter((title) => title !== sessionTitle);

  const totalMinutes = plannedLessons.reduce((sum, lesson) => {
    return sum + (typeof lesson.durationMinutes === 'number' ? lesson.durationMinutes : 0);
  }, 0);

  return {
    lessonTitles,
    totalMinutes: totalMinutes > 0 ? totalMinutes : null,
  };
}

/**
 * Fetches all external_event_id values linked to the user's study sessions.
 * Used to reliably mark calendar events as study sessions instead of relying
 * on fragile emoji/text heuristics.
 */
async function getStudySessionEventIds(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
): Promise<Set<string>> {
  const { data } = await supabase
    .from('study_sessions')
    .select('external_event_id, metrics')
    .eq('user_id', userId)
    .not('external_event_id', 'is', null);

  const ids = new Set<string>();
  for (const row of data ?? []) {
    const calendarSync = resolveSessionCalendarSync({
      externalEventId: row.external_event_id,
      metrics: row.metrics,
    });
    const normalizedId = normalizeCalendarEventId(
      calendarSync?.normalizedExternalEventId || row.external_event_id,
    );
    if (normalizedId) {
      ids.add(normalizedId);
    }
  }
  return ids;
}

export async function getPlanContext(
  userId: string,
  planId: string,
): Promise<{ context: string; syncResult?: SyncResult; timezone: string }> {
  const supabase = createAdminClient();

  logger.info(`🔍 getPlanContext - userId: ${userId}, planId: ${planId}`);

  // planId is always required here — plan resolution is handled upstream by
  // resolvePlanSelectionForChat before this function is called.
  const { data: plan, error: planError } = await supabase
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
    .eq('user_id', userId)
    .eq('id', planId)
    .single();

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

  const { accessToken, provider, calendarId } = await getCalendarAccessToken(userId);

  logger.info(`🔑 Calendar token: ${accessToken ? 'SÍ' : 'NO'}, provider: ${provider}`);

  // Obtener IDs de calendarios seleccionados por el usuario para filtrar eventos
  let selectedCalendarIds: string[] | null = null;
  try {
    selectedCalendarIds = await CalendarIntegrationService.getSelectedCalendarIds(userId);
  } catch {
    // Continuar sin filtro si falla — mejor mostrar más que nada
  }

  // Obtener lista de calendarios disponibles y selección actual para el contexto de LIA
  let calendarListContext = '';
  if (accessToken && provider) {
    try {
      if (provider === 'google') {
        const googleCals = await CalendarIntegrationService.getGoogleCalendarList(accessToken);
        if (googleCals.length > 0) {
          calendarListContext = `\n## 📋 CALENDARIOS DISPONIBLES DEL USUARIO (Google)\n`;
          calendarListContext += `Selección actual: ${selectedCalendarIds ? selectedCalendarIds.join(', ') : 'solo principal (sin configurar)'}\n`;
          for (const cal of googleCals) {
            const isSelected = selectedCalendarIds ? selectedCalendarIds.includes(cal.id) : cal.primary;
            calendarListContext += `- ${isSelected ? '✅' : '⬜'} "${cal.summary}" (ID: ${cal.id})${cal.primary ? ' [PRINCIPAL]' : ''}\n`;
          }
          calendarListContext += `\nEl usuario puede pedirte que cambies qué calendarios se consideran para su disponibilidad. Usa la acción update_calendar_selection con los IDs deseados. SIEMPRE debe quedar al menos 1 calendario seleccionado.\n`;
        }
      } else {
        const msCals = await CalendarIntegrationService.getMicrosoftCalendarList(accessToken);
        if (msCals.length > 0) {
          calendarListContext = `\n## 📋 CALENDARIOS DISPONIBLES DEL USUARIO (Microsoft)\n`;
          calendarListContext += `Selección actual: ${selectedCalendarIds ? selectedCalendarIds.join(', ') : 'solo principal (sin configurar)'}\n`;
          for (const cal of msCals) {
            const isSelected = selectedCalendarIds ? selectedCalendarIds.includes(cal.id) : cal.isDefaultCalendar;
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
    // Obtener external_event_ids de las sesiones de estudio del usuario para marcar
    // correctamente los eventos del calendario como sesiones de estudio.
    // Esto reemplaza la heurística frágil basada en emojis/texto.
    const studySessionEventIds = await getStudySessionEventIds(supabase, userId);

    // PRIMERO: Obtener eventos del calendario para las próximas 2 semanas
    logger.info(`📅 Consultando eventos de hoy: ${todayStart.toISOString()} - ${todayEnd.toISOString()}`);
    calendarEventsToday = await listGoogleCalendarEvents(accessToken, todayStart, todayEnd, timezone, studySessionEventIds, selectedCalendarIds);
    logger.info(`📅 Eventos de hoy encontrados: ${calendarEventsToday.length}`);

    // Eventos de la semana (7 días)
    const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    calendarEventsWeek = await listGoogleCalendarEvents(accessToken, todayStart, weekEnd, timezone, studySessionEventIds, selectedCalendarIds);
    logger.info(`📅 Eventos de la semana encontrados: ${calendarEventsWeek.length}`);

    // Eventos de 30 días (para sincronización)
    calendarEventsTwoWeeks = await listGoogleCalendarEvents(accessToken, todayStart, thirtyDaysLater, timezone, studySessionEventIds, selectedCalendarIds);
    logger.info(`📅 Eventos de 30 días encontrados: ${calendarEventsTwoWeeks.length}`);

    // AHORA: Sincronizar sesiones con el calendario (detectar eliminaciones y re-vincular huérfanas)
    if (plan) {
      syncResult = await syncSessionsWithCalendar(userId, plan.id, accessToken, calendarEventsTwoWeeks, calendarId, timezone);
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
  if (syncResult && syncResult.orphanedSessions.length > 0) {
    context += `## ⚠️ CAMBIOS DETECTADOS EN EL CALENDARIO
Se detectó que estas sesiones del plan ya no tienen un vinculo valido con el calendario:
${syncResult.orphanedSessions.map(s => `- "${s}"`).join('\n')}

**IMPORTANTE:** Estas sesiones NO fueron eliminadas automaticamente del sistema.
Debes mencionar esto al usuario de forma proactiva y preguntarle:
1. Si realmente quiere eliminarlas del plan
2. Si quiere reprogramarlas para otro horario
3. Si necesita resincronizar o ajustar su plan de estudios

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

  // Obtener sesiones de TODOS los planes para contexto global
  const { data: allUserPlans } = await supabase
    .from('study_plans')
    .select('id, name')
    .eq('user_id', userId);

  const planIds = (allUserPlans || []).map(p => p.id);

  const { data: allSessions, error: allSessionsError } = await supabase
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
      lesson_id,
      external_event_id,
      calendar_provider,
      plan_id,
      metrics
    `)
    .in('plan_id', planIds)
    .gte('start_time', oneWeekAgo.toISOString())
    .lte('start_time', thirtyDaysLater.toISOString())
    .order('start_time', { ascending: true });

  const sessions = (allSessions || []).filter(s => s.plan_id === plan.id);
  const otherSessions = (allSessions || []).filter(s => s.plan_id !== plan.id);

  if (sessions && sessions.length > 0) {
  } else if (allSessions && allSessions.length > 0) {
    logger.warn(`⚠️ Hay sesiones pero están fuera del rango de fechas ${oneWeekAgo.toISOString()} - ${thirtyDaysLater.toISOString()}`);
  }

  // Enriquecer sesiones con estado derivado de user_lesson_progress
  const allLessonIds = (allSessions || []).flatMap(s => {
    const m = parseSessionMetrics(s.metrics);
    return (m?.plannedLessons || []).map(l => l.lessonId).filter((id): id is string => Boolean(id));
  });

  const lessonProgressMap = new Map<string, { pct: number; completed: boolean }>();
  if (allLessonIds.length > 0) {
    const { data: progressRows } = await supabase
      .from('user_lesson_progress')
      .select('lesson_id, progress_percentage, is_completed')
      .eq('user_id', userId)
      .in('lesson_id', allLessonIds);
    for (const row of progressRows ?? []) {
      lessonProgressMap.set(row.lesson_id, {
        pct: row.progress_percentage ?? 0,
        completed: Boolean(row.is_completed),
      });
    }
  }

  const deriveSessionStatus = (
    session: { metrics: unknown },
  ): 'effectively_completed' | 'in_progress' | null => {
    const m = parseSessionMetrics(session.metrics);
    const lessonIds = (m?.plannedLessons || []).map(l => l.lessonId).filter((id): id is string => Boolean(id));
    if (lessonIds.length === 0) return null;
    const rows = lessonIds.map(id => lessonProgressMap.get(id)).filter((r): r is { pct: number; completed: boolean } => Boolean(r));
    if (rows.length === 0) return null;
    if (rows.every(r => r.completed)) return 'effectively_completed';
    if (rows.some(r => r.pct > 0)) return 'in_progress';
    return null;
  };

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

      const lessonSummary = getSessionLessonSummary(session.title, session.metrics);
      const calendarSync = resolveSessionCalendarSync({
        externalEventId: session.external_event_id,
        calendarProvider: session.calendar_provider,
        metrics: session.metrics,
      });
      if (lessonSummary.lessonTitles.length > 0) {
        context += `   - Lecciones del plan: ${lessonSummary.lessonTitles.join(' | ')}
`;
      }

      context += `   - Estado calendario: ${
        calendarSync?.externalEventId
          ? `Sincronizada (${calendarSync.provider || 'google'}${calendarSync.calendarId ? `, calendario ${calendarSync.calendarId}` : ''})`
          : 'Sin vinculo con Google Calendar'
      }
`;

      if (
        lessonSummary.totalMinutes
        && session.duration_minutes
        && lessonSummary.totalMinutes !== session.duration_minutes
      ) {
        context += `   - Tiempo total estimado asociado: ${lessonSummary.totalMinutes} minutos
`;
      }
    }

    context += `
**TOTAL: ${sessions.length} sesiones de estudio programadas en este plan.**
`;
  } else {
    context += `
⚠️ **IMPORTANTE: NO HAY SESIONES DE ESTUDIO PROGRAMADAS EN ESTE PLAN.**
El usuario NO tiene ninguna sesión de estudio para "${plan.name}" en los próximos 14 días.
`;
  }

  // Agregar sesiones de OTROS planes
  if (otherSessions && otherSessions.length > 0) {
    context += `
## 📂 SESIONES DE OTROS PLANES (bloquean disponibilidad)
`;
    for (const session of otherSessions) {
      const planName = allUserPlans?.find(p => p.id === session.plan_id)?.name || 'Otro plan';
      const startDate = new Date(session.start_time);
      context += `- **${session.title}** [Plan: ${planName}] (${formatDate(startDate)} ${formatTime(startDate)})
`;
    }
  }

  // Separar work blocks de otros eventos — los work blocks son contenedores, no conflictos
  const workBlockEvents = calendarEventsWeek.filter(e => !e.isStudySession && isWorkBlockEvent(e));
  const nonWorkOtherEvents = calendarEventsWeek.filter(e => !e.isStudySession && !isWorkBlockEvent(e));

  if (workBlockEvents.length > 0) {
    context += `
## 🏢 BLOQUES DE TRABAJO DEL USUARIO (horario laboral)
⚠️ IMPORTANTE: Las sesiones de estudio programadas DENTRO de estos bloques son COMPORTAMIENTO CORRECTO. NO son conflictos. Los bloques de trabajo son el horario donde el usuario estudia.
`;
    for (const event of workBlockEvents) {
      const startDate = new Date(event.start);
      const endDate = new Date(event.end);
      context += `- **${event.title}** — ${formatDate(startDate)}, ${formatTime(startDate)} - ${formatTime(endDate)} [ID: ${event.id}]
`;
    }
  }

  if (nonWorkOtherEvents.length > 0) {
    context += `
## 📌 OTROS EVENTOS DE LA SEMANA (pueden generar conflictos reales con sesiones)
`;
    for (const event of nonWorkOtherEvents.slice(0, 10)) {
      const eventDate = new Date(event.start);
      const timeStr = event.isAllDay ? 'Todo el día' : `${formatTime(eventDate)}`;
      context += `- **${event.title}** - ${formatDate(eventDate)} ${timeStr} [ID: ${event.id}]
`;
    }
  }

  // =========================================================================
  // ANÁLISIS PROACTIVO - Inteligencia para detectar conflictos y oportunidades
  // =========================================================================
  if (allSessions && allSessions.length > 0 && calendarEventsTwoWeeks.length > 0) {
    const enrichedSessions = (allSessions || []).map(s => ({
      ...s,
      derivedStatus: deriveSessionStatus(s),
      hasCalendarEventLinked: Boolean(
        resolveSessionCalendarSync({
          externalEventId: s.external_event_id,
          calendarProvider: s.calendar_provider,
          metrics: s.metrics,
        })?.externalEventId
      ),
    }));

    const proactiveAnalysis = await analyzeProactively(
      userId,
      plan.id,
      enrichedSessions,
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

    // Sesiones efectivamente completadas (lecciones al 100%)
    if (proactiveAnalysis.effectivelyCompletedSessions.length > 0) {
      context += `
## ✅ SESIONES EFECTIVAMENTE COMPLETADAS (lecciones al 100%)
`;
      for (const completed of proactiveAnalysis.effectivelyCompletedSessions) {
        context += `- **${completed.sessionTitle}** [ID: ${completed.sessionId}] — Programada hasta: ${completed.scheduledEndTime}, Vinculada al calendario: ${completed.calendarEventLinked ? 'Sí' : 'No'}${completed.completedEarly ? ' — ⚡ Completada antes del horario' : ''}
  → Ofrece al usuario eliminar el evento del calendario para liberar ese bloque (usa delete_session con confirmación).
`;
      }
    }

    // Sesiones en progreso (inicio registrado, sin completar)
    if (proactiveAnalysis.partialSessions.length > 0) {
      context += `
## ⏳ SESIONES EN PROGRESO (iniciadas pero sin completar)
`;
      for (const partial of proactiveAnalysis.partialSessions) {
        context += `- **${partial.sessionTitle}** [ID: ${partial.sessionId}] — Progreso: ${partial.progressPct}% — Tiempo restante estimado: ${partial.remainingMinutes} min
  → Slots sugeridos para completarla: ${partial.suggestedCompletionSlots.join(' | ') || 'Buscar hueco libre'}
`;
      }
    }
  }

  return { context, syncResult, timezone };
}

