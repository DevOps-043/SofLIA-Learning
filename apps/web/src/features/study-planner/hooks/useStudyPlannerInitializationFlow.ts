'use client';

import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';

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

interface StudyPlannerUserContextApiResponse {
  data?: {
    courses?: any[];
    professionalProfile?: {
      area?: { nombre?: string | null } | null;
      nivel?: { nombre?: string | null } | null;
      rol?: { nombre?: string | null } | null;
      tamanoEmpresa?: {
        maxEmpleados?: number | null;
        minEmpleados?: number | null;
        nombre?: string | null;
      } | null;
    } | null;
    organization?: { name?: string | null } | null;
    user?: {
      displayName?: string | null;
      firstName?: string | null;
      username?: string | null;
    } | null;
    userId?: string | null;
    userType?: string | null;
    workTeams?: Array<{ name?: string | null; role?: string | null }> | null;
  };
  success?: boolean;
}

function mapAssignedCourses(courses: any[] | undefined): StudyPlannerAssignedCourse[] {
  if (!Array.isArray(courses)) {
    return [];
  }

  return courses
    .map((course) => ({
      courseId: course.courseId || course.course?.id || course.id,
      dueDate: course.dueDate || course.course?.dueDate || null,
      title: course.course?.title || course.title || 'Curso',
    }))
    .filter((course) => Boolean(course.courseId))
    .sort((a, b) => {
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }

      if (a.dueDate && !b.dueDate) {
        return -1;
      }

      if (!a.dueDate && b.dueDate) {
        return 1;
      }

      return 0;
    });
}

function mapUserContext(userProfile: StudyPlannerUserContextApiResponse['data']): StudyPlannerUserContext | null {
  if (!userProfile) {
    return null;
  }

  const workTeams =
    userProfile.workTeams?.map((team) => ({
      name: team.name || 'Equipo',
      role: team.role || 'member',
    })) || null;

  return {
    area: userProfile.professionalProfile?.area?.nombre || null,
    maxEmpleados: userProfile.professionalProfile?.tamanoEmpresa?.maxEmpleados || null,
    minEmpleados: userProfile.professionalProfile?.tamanoEmpresa?.minEmpleados || null,
    nivel: userProfile.professionalProfile?.nivel?.nombre || null,
    organizationName: userProfile.organization?.name || null,
    rol: userProfile.professionalProfile?.rol?.nombre || null,
    tamanoEmpresa: userProfile.professionalProfile?.tamanoEmpresa?.nombre || null,
    userName:
      userProfile.user?.firstName ||
      userProfile.user?.displayName ||
      userProfile.user?.username ||
      null,
    userType: 'b2b',
    workTeams,
  };
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
        const userResponse = await fetch('/api/study-planner/user-context');
        if (userResponse.ok) {
          const userData = (await userResponse.json()) as StudyPlannerUserContextApiResponse;
          const userId = userData.data?.userId;

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

          if (userData.success && userData.data) {
            const assignedCourses = mapAssignedCourses(userData.data.courses);

            setUserContext(mapUserContext(userData.data));
            setAssignedCourses(assignedCourses);

            if (assignedCourses.length > 0) {
              setSelectedCourseIds(
                assignedCourses.map((course) => course.courseId).filter(Boolean),
              );
            }
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
        console.error('Error verificando integracion inicial del planificador:', error);
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
          console.error('Error reanudando flujo tras OAuth:', error);
        }
      };

      void resumeFlow();
      return;
    }

    if (!calendarError) {
      return;
    }

    console.error('Error en conexion de calendario:', calendarError);
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
