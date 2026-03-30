/**
 * Context Service
 * Handles plan context retrieval using calendar and analysis services.
 */

import { logger } from '../../../../../lib/utils/logger';
import { CalendarIntegrationService } from '../../../../../features/study-planner/services/calendar-integration.service';
import { createAdminClient, getCalendarAccessToken, listGoogleCalendarEvents } from './calendar.service';
import { syncSessionsWithCalendar, analyzeProactively } from './analysis.service';
import {
  formatDate,
  formatTime,
  formatPreferredDays,
  translateStatus,
} from './format.utils';
import type { SyncResult, CalendarEvent } from './types';

export async function getPlanContext(userId: string, planId?: string): Promise<{ context: string; syncResult?: SyncResult; timezone: string }> {
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
