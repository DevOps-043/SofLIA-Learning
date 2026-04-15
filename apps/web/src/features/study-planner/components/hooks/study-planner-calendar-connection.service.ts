'use client';

import { fetchStudyPlannerUserContext } from '../../services/planner-user-context-client.service';
import {
  buildSkippedCalendarProfileInfo,
  getProviderName,
} from './study-planner-calendar-actions.shared';
import type {
  CalendarProvider,
  StudyPlannerDisconnectCalendarParams,
  StudyPlannerSkipCalendarConnectionParams,
} from './study-planner-calendar-actions.types';

interface DisconnectCalendarPayload {
  error?: string;
  success?: boolean;
}

const defaultDependencies = {
  fetchStudyPlannerUserContext,
};

type StudyPlannerCalendarConnectionDependencies = typeof defaultDependencies;

export function createDisconnectCalendarHandler(
  params: StudyPlannerDisconnectCalendarParams,
) {
  return async (provider: CalendarProvider) => {
    try {
      params.setIsConnectingCalendar(true);

      const response = await fetch('/api/study-planner/calendar/disconnect', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider }),
      });

      const data = (await response.json()) as DisconnectCalendarPayload;
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al desconectar el calendario');
      }

      params.setConnectedCalendar(null);
      params.setShowCalendarModal(false);

      const disconnectMessage = `He desconectado tu calendario de ${getProviderName(provider)}. Puedes volver a conectarlo cuando lo desees.`;
      params.setConversationHistory((previousHistory) => [
        ...previousHistory,
        {
          role: 'assistant',
          content: disconnectMessage,
        },
      ]);

      if (params.isAudioEnabled) {
        await params.speakText(
          `Calendario de ${getProviderName(provider)} desconectado exitosamente.`,
        );
      }
    } catch (error) {
      console.error('[disconnectCalendar] Error desconectando calendario:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error desconocido al desconectar el calendario';

      params.setConversationHistory((previousHistory) => [
        ...previousHistory,
        {
          role: 'assistant',
          content: `No pude desconectar tu calendario. ${errorMessage}`,
        },
      ]);
    } finally {
      params.setIsConnectingCalendar(false);
    }
  };
}

export function createSkipCalendarConnectionHandler(
  params: StudyPlannerSkipCalendarConnectionParams,
  dependencies: Partial<StudyPlannerCalendarConnectionDependencies> = {},
) {
  const deps: StudyPlannerCalendarConnectionDependencies = {
    ...defaultDependencies,
    ...dependencies,
  };

  return async () => {
    params.setShowCalendarModal(false);
    params.setCalendarSkipped(true);
    params.setIsProcessing(true);
    params.setConversationHistory((previousHistory) => [
      ...previousHistory,
      {
        role: 'user',
        content: 'Prefiero no conectar mi calendario por ahora',
      },
    ]);

    try {
      const fetchedUserContext = await deps.fetchStudyPlannerUserContext();
      const userProfile = fetchedUserContext.rawProfile;

      if (fetchedUserContext.userContext) {
        params.setUserContext(fetchedUserContext.userContext);
      }

      const profileInfo = buildSkippedCalendarProfileInfo(userProfile);
      const responseMessage = `Entendido, no hay problema.${profileInfo}\n\nCuentame:\nQue dias de la semana prefieres estudiar?\nEn que horario te funciona mejor: manana, tarde o noche?\n\n(Por ejemplo: "Lunes, miercoles y viernes por la noche" o "Fines de semana por la manana")`;

      params.setConversationHistory((previousHistory) => [
        ...previousHistory,
        { role: 'assistant', content: responseMessage },
      ]);

      if (params.isAudioEnabled) {
        const audioMessage = userProfile?.professionalProfile?.rol?.nombre
          ? `Entendido. Veo que eres ${userProfile.professionalProfile.rol.nombre}. Que dias y horarios prefieres para estudiar?`
          : 'Entendido. Que dias y horarios prefieres para estudiar?';
        await params.speakText(audioMessage);
      }
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      const fallbackMessage =
        'Entendido. Cuentame: Que dias de la semana prefieres estudiar y en que horarios? (Por ejemplo: "Lunes a viernes por la noche")';
      params.setConversationHistory((previousHistory) => [
        ...previousHistory,
        { role: 'assistant', content: fallbackMessage },
      ]);

      if (params.isAudioEnabled) {
        await params.speakText(fallbackMessage);
      }
    } finally {
      params.setIsProcessing(false);
    }
  };
}
