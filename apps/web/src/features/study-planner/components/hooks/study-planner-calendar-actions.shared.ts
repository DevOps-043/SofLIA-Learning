import { calculateStudyPlannerEstimatedAvailability } from '../../services/planner-calendar-analysis.service';
import type { StudyPlannerUserContextApiData } from '../../services/planner-user-context-client.service';
import type { StudyPlannerMessage } from '../../types/planner-ui.types';
import type {
  CalendarEventsPayload,
  StateSetter,
  StudyPlannerCalendarEventsRequest,
} from './study-planner-calendar-actions.types';

export function getProviderName(provider: string): string {
  return provider === 'google' ? 'Google' : 'Microsoft';
}

export function normalizePlannerUserType(
  userType: string | null | undefined,
): 'b2b' | 'b2c' | null {
  return userType === 'b2b' || userType === 'b2c' ? userType : null;
}

export function buildReconnectCalendarMessage(provider: string): string {
  return `Tu conexion con el calendario de ${getProviderName(provider)} expiro. Por favor, reconectalo para continuar.`;
}

export function buildCalendarAnalysisErrorMessage(provider: string): string {
  return `Tu calendario de ${getProviderName(provider)} esta conectado, pero hubo un problema al analizarlo.\n\nCuentame manualmente:\nQue dias de la semana prefieres estudiar?\nEn que horario te funciona mejor: manana, tarde o noche?`;
}

export function buildSkippedCalendarProfileInfo(
  userProfile: StudyPlannerUserContextApiData | null,
): string {
  if (!userProfile) {
    return '';
  }

  const isB2B = userProfile.userType === 'b2b';
  const role = userProfile.professionalProfile?.rol?.nombre;
  const area = userProfile.professionalProfile?.area?.nombre;
  const level = userProfile.professionalProfile?.nivel?.nombre;
  const companySize = userProfile.professionalProfile?.tamanoEmpresa?.nombre;
  const organizationName = userProfile.organization?.name;

  let profileInfo = '\n\n**HE REVISADO TU PERFIL:**\n';
  if (isB2B && organizationName) {
    profileInfo += `- Tipo: Usuario B2B (perteneces a "${organizationName}")\n`;
  } else {
    profileInfo += '- Tipo: Usuario B2C (profesional independiente)\n';
  }
  if (role) {
    profileInfo += `- Rol: ${role}\n`;
  }
  if (area) {
    profileInfo += `- Area: ${area}\n`;
  }
  if (level) {
    profileInfo += `- Nivel: ${level}\n`;
  }
  if (companySize) {
    profileInfo += `- Tamano de empresa: ${companySize}\n`;
  }

  const availability = calculateStudyPlannerEstimatedAvailability({
    rol: role || null,
    nivel: level || null,
    tamanoEmpresa: companySize || null,
    minEmpleados: userProfile.professionalProfile?.tamanoEmpresa?.minEmpleados ?? null,
    maxEmpleados: userProfile.professionalProfile?.tamanoEmpresa?.maxEmpleados ?? null,
    userType: normalizePlannerUserType(userProfile.userType),
  });

  profileInfo += '\n**ESTIMACION BASADA EN TU PERFIL:**\n';
  profileInfo += `- Tiempo disponible: ~${availability.minutesPerDay} min/dia\n`;
  profileInfo += `- Sesiones recomendadas: ${availability.recommendedSessionLength} min`;

  return profileInfo;
}

export async function fetchStudyPlannerCalendarEvents({
  endDate,
  provider,
  setConnectedCalendar,
  setConversationHistory,
  setShowCalendarModal,
  startDate,
}: StudyPlannerCalendarEventsRequest): Promise<{
  events: CalendarEventsPayload['events'];
  shouldAbort: boolean;
}> {
  try {
    const eventsResponse = await fetch(
      `/api/study-planner/calendar/events?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&includeStudySessions=true`,
    );

    if (eventsResponse.ok) {
      const payload = (await eventsResponse.json()) as CalendarEventsPayload;
      return {
        events: Array.isArray(payload.events) ? payload.events : [],
        shouldAbort: false,
      };
    }

    let errorPayload: CalendarEventsPayload = {};
    try {
      errorPayload = (await eventsResponse.json()) as CalendarEventsPayload;
    } catch {
      errorPayload = {};
    }

    if (eventsResponse.status === 401 && errorPayload.requiresReconnection) {
      setConnectedCalendar(null);
      setConversationHistory((previousHistory) => [
        ...previousHistory,
        {
          role: 'assistant',
          content: buildReconnectCalendarMessage(provider),
        },
      ]);

      globalThis.setTimeout(() => {
        setShowCalendarModal(true);
      }, 1000);

      return {
        events: [],
        shouldAbort: true,
      };
    }

    console.error('Error en respuesta de eventos:', eventsResponse.status, errorPayload.error);
    return {
      events: [],
      shouldAbort: false,
    };
  } catch (error) {
    console.error('Error obteniendo eventos:', error);
    return {
      events: [],
      shouldAbort: false,
    };
  }
}

export function appendCalendarRecommendationMessage(
  calendarMessage: string,
  setConversationHistory: StateSetter<StudyPlannerMessage[]>,
) {
  setConversationHistory((previousHistory) => {
    const hasRecommendations = previousHistory.some(
      (message) =>
        message.role === 'assistant'
        && (
          message.content.includes('MIS RECOMENDACIONES')
          || message.content.includes('METAS SEMANALES')
          || (
            message.content.includes('analizado tu calendario')
            && message.content.includes('horarios')
          )
        ),
    );

    if (hasRecommendations && calendarMessage.includes('MIS RECOMENDACIONES')) {
      return previousHistory;
    }

    return [...previousHistory, { role: 'assistant', content: calendarMessage }];
  });
}
