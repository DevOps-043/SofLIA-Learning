'use client';

import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import { fetchStudyPlannerUserContext } from '../services/planner-user-context-client.service';

import type {
  StudyApproach,
  StudyPlannerAssignedCourse,
  StudyPlannerCalendarProvider,
  StudyPlannerMessage,
  StudyPlannerUserContext,
} from '../types/planner-ui.types';
import type { StudyPlannerStoredLessonDistribution } from '../types/planner-schedule.types';

type StateSetter<T> = Dispatch<SetStateAction<T>>;
type CalendarProvider = NonNullable<StudyPlannerCalendarProvider>;
type AnalyzeCalendarAndSuggest = (
  provider: CalendarProvider,
  targetDateParam?: string,
  approachParam?: StudyApproach | null,
) => Promise<void>;

interface UseStudyPlannerInitializationFlowParams {
  currentUserId: string | null;
  getAnalyzeCalendarAndSuggest: () => AnalyzeCalendarAndSuggest;
  hasAttemptedOpenRef: MutableRefObject<boolean>;
  setAssignedCourses: StateSetter<StudyPlannerAssignedCourse[]>;
  setConnectedCalendar: StateSetter<StudyPlannerCalendarProvider>;
  setConversationHistory: StateSetter<StudyPlannerMessage[]>;
  setCurrentUserId: StateSetter<string | null>;
  setHasConfiguredCalendars: StateSetter<boolean>;
  setHasShownFinalSummary: StateSetter<boolean>;
  setIsVisible: StateSetter<boolean>;
  setSavedLessonDistribution: StateSetter<StudyPlannerStoredLessonDistribution[]>;
  setSelectedCourseIds: StateSetter<string[]>;
  setShowConversation: StateSetter<boolean>;
  setUserContext: StateSetter<StudyPlannerUserContext | null>;
}

export function useStudyPlannerInitializationFlow({
  currentUserId,
  getAnalyzeCalendarAndSuggest,
  hasAttemptedOpenRef,
  setAssignedCourses,
  setConnectedCalendar,
  setConversationHistory,
  setCurrentUserId,
  setHasConfiguredCalendars,
  setHasShownFinalSummary,
  setIsVisible,
  setSavedLessonDistribution,
  setSelectedCourseIds,
  setShowConversation,
  setUserContext,
}: UseStudyPlannerInitializationFlowParams): void {
  useEffect(() => {
    const checkUserAndCalendarStatus = async () => {
      try {
        const userData = await fetchStudyPlannerUserContext();
        const userId = userData.userId;

        if (currentUserId && userId && currentUserId !== userId) {
          setConnectedCalendar(null);
          setUserContext(null);
          setConversationHistory([]);
          setShowConversation(true);
          setIsVisible(false);
          hasAttemptedOpenRef.current = false;
          setHasShownFinalSummary(false);
          setSavedLessonDistribution([]);
        }

        if (userId) {
          setCurrentUserId(userId);
        }

        if (userData.success) {
          setUserContext(userData.userContext);
          setAssignedCourses(userData.assignedCourses);

          if (userData.assignedCourses.length > 0) {
            // Courses are loaded for display, but NOT auto-selected.
            // The user must explicitly choose which course to plan (RF-01, RF-02, BUG-02).
            setSelectedCourseIds([]);
          }
        }

        const response = await fetch('/api/study-planner/calendar/status');
        if (!response.ok) {
          return;
        }

        const data = await response.json();
        if (data.isConnected && data.provider) {
          setConnectedCalendar(data.provider as CalendarProvider);

          try {
            const selectionResponse = await fetch('/api/study-planner/calendar/selection');
            if (!selectionResponse.ok) {
              return;
            }

            const selectionData = await selectionResponse.json();
            if (selectionData.success && selectionData.data?.selectedCalendarIds?.length > 0) {
              setHasConfiguredCalendars(true);
            }
          } catch {
            // Ignore selection lookup failures to keep the planner usable.
          }

          return;
        }

        setConnectedCalendar(null);
      } catch (error) {
        techDebtLogger.error('Error verificando integracion inicial del planificador:', error);
      }
    };

    void checkUserAndCalendarStatus();
  }, [
    currentUserId,
    hasAttemptedOpenRef,
    setAssignedCourses,
    setConnectedCalendar,
    setConversationHistory,
    setCurrentUserId,
    setHasConfiguredCalendars,
    setHasShownFinalSummary,
    setIsVisible,
    setSavedLessonDistribution,
    setSelectedCourseIds,
    setShowConversation,
    setUserContext,
  ]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const calendarConnected = params.get('calendar_connected');
    const calendarError = params.get('calendar_error');

    if (calendarConnected === 'true') {
      window.history.replaceState({}, '', window.location.pathname);

      const resumeFlow = async () => {
        try {
          const response = await fetch('/api/study-planner/calendar/status');
          if (!response.ok) {
            return;
          }

          const data = await response.json();
          if (!data.isConnected || !data.provider) {
            return;
          }

          const provider = data.provider as CalendarProvider;
          setConnectedCalendar(provider);
          setConversationHistory((previousHistory) => [
            ...previousHistory,
            {
              role: 'assistant',
              content: `Excelente. He confirmado que tu calendario de ${provider === 'google' ? 'Google' : 'Microsoft'} esta conectado. Voy a analizar tu disponibilidad ahora mismo.`,
            },
          ]);

          window.setTimeout(() => {
            void getAnalyzeCalendarAndSuggest()(provider, undefined, 'balance');
          }, 1000);
        } catch (error) {
          techDebtLogger.error('Error reanudando flujo tras OAuth:', error);
        }
      };

      void resumeFlow();
      return;
    }

    if (!calendarError) {
      return;
    }

    techDebtLogger.error('Error en conexion de calendario:', calendarError);
    window.history.replaceState({}, '', window.location.pathname);
    setConversationHistory((previousHistory) => [
      ...previousHistory,
      {
        role: 'assistant',
        content: `Hubo un problema al conectar tu calendario: ${decodeURIComponent(calendarError)}. Quieres intentarlo de nuevo o continuar sin calendario?`,
      },
    ]);
  }, [getAnalyzeCalendarAndSuggest, setConnectedCalendar, setConversationHistory]);
}
