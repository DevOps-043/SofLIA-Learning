import type { Dispatch, SetStateAction } from 'react';
import type {
  StudyApproach,
  StudyPlannerCourseOption,
  StudyPlannerMessage,
} from '../types/planner-ui.types';
import type { StudyPlannerStoredLessonDistribution } from '../types/planner-schedule.types';
import {
  buildStudyPlanPayload,
  buildStudyPlanSuccessMessage,
  cleanupPreviousPlanEvents,
  saveStudyPlanRequest,
  syncStudyPlanSessions,
} from '../services/study-plan-persistence.service';

interface UseStudyPlanPersistenceParams {
  availableCourses: StudyPlannerCourseOption[];
  connectedCalendar: 'google' | 'microsoft' | null;
  isAudioEnabled: boolean;
  savedLessonDistribution: StudyPlannerStoredLessonDistribution[];
  savedPlanId: string | null;
  savedTargetDate: string | null;
  selectedCourseIds: string[];
  setConnectedCalendar: Dispatch<SetStateAction<'google' | 'microsoft' | null>>;
  setConversationHistory: Dispatch<SetStateAction<StudyPlannerMessage[]>>;
  setIsProcessing: Dispatch<SetStateAction<boolean>>;
  setSavedPlanId: Dispatch<SetStateAction<string | null>>;
  speakText: (text: string) => Promise<unknown>;
  studyApproach: StudyApproach | null;
  userType: 'b2b' | null | undefined;
}

interface SaveStudyPlanOptions {
  scheduleRedirect: () => void;
}

export function useStudyPlanPersistence(params: UseStudyPlanPersistenceParams) {
  const replaceProcessingMessage = (content: string) => {
    params.setConversationHistory((previousHistory) => {
      const nextHistory = [...previousHistory];
      const lastIndex = nextHistory.length - 1;

      if (
        nextHistory[lastIndex]?.role === 'assistant'
        && nextHistory[lastIndex]?.content.includes('Procesando')
      ) {
        nextHistory[lastIndex] = { role: 'assistant', content };
        return nextHistory;
      }

      nextHistory.push({ role: 'assistant', content });
      return nextHistory;
    });
  };

  const saveStudyPlan = async ({ scheduleRedirect }: SaveStudyPlanOptions) => {
    try {
      if (params.savedLessonDistribution.length === 0) {
        throw new Error('No hay horarios para guardar.');
      }

      const payload = buildStudyPlanPayload({
        availableCourses: params.availableCourses,
        connectedCalendar: params.connectedCalendar,
        savedLessonDistribution: params.savedLessonDistribution,
        savedTargetDate: params.savedTargetDate,
        selectedCourseIds: params.selectedCourseIds,
        studyApproach: params.studyApproach,
        userType: params.userType,
      });

      if (params.savedPlanId && params.connectedCalendar) {
        try {
          await cleanupPreviousPlanEvents(params.savedPlanId);
        } catch (cleanupError) {
          console.error('Error cleaning up old events:', cleanupError);
        }
      }

      const saveData = await saveStudyPlanRequest(payload);

      if (saveData.planId) {
        params.setSavedPlanId(saveData.planId);
      }

      const syncResult = params.connectedCalendar
        ? await syncStudyPlanSessions(saveData.sessionIds || [])
        : { success: false, insertedCount: 0, requiresReconnection: false };

      if (syncResult.requiresReconnection) {
        params.setConnectedCalendar(null);
        params.setConversationHistory((previousHistory) => [
          ...previousHistory,
          {
            role: 'assistant',
            content: 'Tu conexion con el calendario ha expirado. Reconecta tu calendario para sincronizar.',
          },
        ]);
      }

      replaceProcessingMessage(
        buildStudyPlanSuccessMessage({
          connectedCalendar: params.connectedCalendar,
          insertedCount: syncResult.insertedCount,
          sessionsCount: payload.sessions.length,
          syncSuccess: syncResult.success,
        }),
      );

      params.setIsProcessing(false);
      scheduleRedirect();

      if (params.isAudioEnabled) {
        void params
          .speakText(
            'Perfecto. He guardado tu plan de estudios con todas las sesiones programadas. Puedes comenzar a estudiar cuando lo desees.',
          )
          .catch((audioError) => {
            console.error('Error reproduciendo audio:', audioError);
          });
      }
    } catch (error) {
      console.error('Error guardando plan:', error);
      const errorMessage = `Lo siento, hubo un error al guardar tu plan de estudios: ${
        error instanceof Error ? error.message : 'Error desconocido'
      }. Por favor, intenta de nuevo.`;

      replaceProcessingMessage(errorMessage);
      params.setIsProcessing(false);
    }
  };

  return {
    saveStudyPlan,
  };
}
