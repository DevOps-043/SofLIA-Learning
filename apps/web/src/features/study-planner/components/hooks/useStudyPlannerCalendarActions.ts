'use client';

import { useRef } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { useStudyPlannerB2BCalendarAnalysis } from '../../hooks/useStudyPlannerB2BCalendarAnalysis';
import { calculateStudyPlannerEstimatedAvailability } from '../../services/planner-calendar-analysis.service';
import { calculateStudyPlannerTotalLessonsNeeded } from '../../services/planner-course-workload.service';
import {
  buildStudyPlannerAudioSummary,
  buildStudyPlannerCalendarRecommendationMessage,
  buildStudyPlannerLessonDistribution,
} from '../../services/planner-calendar-recommendation.service';
import { resolveStudyPlannerPendingLessonsForRecommendations } from '../../services/planner-pending-lessons.service';
import { analyzeStudyPlannerSlotCalendar } from '../../services/planner-slot-analysis.service';
import { selectStudyPlannerFinalSlots } from '../../services/planner-slot-selection.service';
import { resolveStudyPlannerTargetWindow } from '../../services/planner-target-window.service';
import {
  fetchStudyPlannerUserContext,
  type StudyPlannerUserContextApiData,
} from '../../services/planner-user-context-client.service';
import type {
  StudyApproach,
  StudyPlannerAssignedCourse,
  StudyPlannerCalendarProvider,
  StudyPlannerCourseOption,
  StudyPlannerMessage,
  StudyPlannerPendingLesson,
  StudyPlannerUserContext,
} from '../../types/planner-ui.types';
import type {
  StudyPlannerCalendarEventLike,
  StudyPlannerCalendarDataMap,
  StudyPlannerStoredLessonDistribution,
} from '../../types/planner-schedule.types';

type StateSetter<T> = Dispatch<SetStateAction<T>>;
type CalendarProvider = NonNullable<StudyPlannerCalendarProvider>;

interface CalendarEventsPayload {
  error?: string;
  events?: StudyPlannerCalendarEventLike[];
  requiresReconnection?: boolean;
}

export interface UseStudyPlannerCalendarActionsParams {
  availableCourses: StudyPlannerCourseOption[];
  assignedCourses: StudyPlannerAssignedCourse[];
  isAudioEnabled: boolean;
  isProcessing: boolean;
  pendingLessonsRef: MutableRefObject<StudyPlannerPendingLesson[]>;
  pendingLessonsWithNames: StudyPlannerPendingLesson[];
  selectedCourseIds: string[];
  setCalendarSkipped: StateSetter<boolean>;
  setConnectedCalendar: StateSetter<StudyPlannerCalendarProvider>;
  setConversationHistory: StateSetter<StudyPlannerMessage[]>;
  setIsConnectingCalendar: StateSetter<boolean>;
  setIsProcessing: StateSetter<boolean>;
  setPendingLessonsWithNames: StateSetter<StudyPlannerPendingLesson[]>;
  setSavedCalendarData: StateSetter<StudyPlannerCalendarDataMap | null>;
  setSavedLessonDistribution: StateSetter<StudyPlannerStoredLessonDistribution[]>;
  setSavedTargetDate: StateSetter<string | null>;
  setSavedTotalLessons: StateSetter<number>;
  setSelectedCourseIds: StateSetter<string[]>;
  setShowCalendarModal: StateSetter<boolean>;
  setTargetDate: StateSetter<string | null>;
  setUserContext: StateSetter<StudyPlannerUserContext | null>;
  speakText: (text: string) => Promise<void>;
  studyApproach: StudyApproach | null;
  targetDate: string | null;
  userContext: StudyPlannerUserContext | null;
  userId: string | undefined;
}

function getProviderName(provider: string): string {
  return provider === 'google' ? 'Google' : 'Microsoft';
}

function normalizePlannerUserType(
  userType: string | null | undefined,
): 'b2b' | 'b2c' | null {
  return userType === 'b2b' || userType === 'b2c' ? userType : null;
}

function buildReconnectCalendarMessage(provider: string): string {
  return `Tu conexion con el calendario de ${getProviderName(provider)} expiro. Por favor, reconectalo para continuar.`;
}

function buildCalendarAnalysisErrorMessage(provider: string): string {
  return `Tu calendario de ${getProviderName(provider)} esta conectado, pero hubo un problema al analizarlo.\n\nCuentame manualmente:\n¿Que dias de la semana prefieres estudiar?\n¿En que horario te funciona mejor: manana, tarde o noche?`;
}

function buildSkippedCalendarProfileInfo(
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

async function fetchCalendarEvents({
  endDate,
  provider,
  setConnectedCalendar,
  setConversationHistory,
  setShowCalendarModal,
  startDate,
}: {
  endDate: Date;
  provider: string;
  setConnectedCalendar: StateSetter<StudyPlannerCalendarProvider>;
  setConversationHistory: StateSetter<StudyPlannerMessage[]>;
  setShowCalendarModal: StateSetter<boolean>;
  startDate: Date;
}): Promise<{ events: StudyPlannerCalendarEventLike[]; shouldAbort: boolean }> {
  try {
    const eventsResponse = await fetch(
      `/api/study-planner/calendar/events?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
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

function appendCalendarRecommendationMessage(
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

export function useStudyPlannerCalendarActions({
  availableCourses,
  assignedCourses,
  isAudioEnabled,
  isProcessing,
  pendingLessonsRef,
  pendingLessonsWithNames,
  selectedCourseIds,
  setCalendarSkipped,
  setConnectedCalendar,
  setConversationHistory,
  setIsConnectingCalendar,
  setIsProcessing,
  setPendingLessonsWithNames,
  setSavedCalendarData,
  setSavedLessonDistribution,
  setSavedTargetDate,
  setSavedTotalLessons,
  setSelectedCourseIds,
  setShowCalendarModal,
  setTargetDate,
  setUserContext,
  speakText,
  studyApproach,
  targetDate,
  userContext,
  userId,
}: UseStudyPlannerCalendarActionsParams) {
  const analyzeCalendarAndSuggestRef = useRef<(
    provider: string,
    targetDateParam?: string,
    approachParam?: StudyApproach | null,
    skipB2BRedirect?: boolean,
  ) => Promise<void>>(async () => {});

  const { analyzeCalendarAndSuggestB2B } = useStudyPlannerB2BCalendarAnalysis({
    analyzeCalendarAndSuggest: (
      provider,
      effectiveTargetDate,
      effectiveApproach,
      skipB2BRedirect,
    ) =>
      analyzeCalendarAndSuggestRef.current(
        provider,
        effectiveTargetDate,
        effectiveApproach,
        skipB2BRedirect,
      ),
    pendingLessonsRef,
    selectedCourseIds,
    setConversationHistory,
    setIsProcessing,
    setPendingLessonsWithNames,
    setSelectedCourseIds,
    setTargetDate,
  });

  const analyzeCalendarAndSuggest = async (
    provider: string,
    targetDateParam?: string,
    approachParam?: StudyApproach | null,
    skipB2BRedirect?: boolean,
  ) => {
    const effectiveApproach = approachParam !== undefined ? approachParam : studyApproach;
    let effectiveTargetDate = targetDateParam || targetDate;

    if (isProcessing) {
      console.warn(
        '[analyzeCalendarAndSuggest] Se llamo mientras estaba procesando. Continuando para recuperar el flujo.',
      );
    }

    if (!effectiveApproach) {
      setIsProcessing(false);
      return;
    }

    if (!effectiveTargetDate) {
      const nearestAssignedCourse = assignedCourses.find((course) => course.dueDate);
      if (nearestAssignedCourse?.dueDate) {
        effectiveTargetDate = new Date(nearestAssignedCourse.dueDate).toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }
    }

    if (!effectiveTargetDate) {
      const weeksToAdd = effectiveApproach === 'corto' ? 2 : effectiveApproach === 'balance' ? 4 : 8;
      const fallbackTargetDate = new Date();
      fallbackTargetDate.setDate(fallbackTargetDate.getDate() + weeksToAdd * 7);
      effectiveTargetDate = fallbackTargetDate.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }

    setIsProcessing(true);
    const processingTimeout = globalThis.setTimeout(() => {
      setIsProcessing(false);
    }, 45000);

    try {
      const fetchedUserContext = await fetchStudyPlannerUserContext();
      const userProfile = fetchedUserContext.rawProfile;

      if (fetchedUserContext.userContext) {
        setUserContext(fetchedUserContext.userContext);
      }

      if (
        userProfile?.userType === 'b2b'
        && assignedCourses.length > 0
        && !skipB2BRedirect
      ) {
        await analyzeCalendarAndSuggestB2B(
          provider,
          effectiveApproach,
          userProfile,
          assignedCourses,
        );
        return;
      }

      const userProfileForAnalysis = userProfile
        ? {
            professionalProfile: userProfile.professionalProfile || null,
            userType: normalizePlannerUserType(userProfile.userType),
          }
        : null;

      const targetWindow = resolveStudyPlannerTargetWindow({
        targetDate: effectiveTargetDate,
        studyApproach: effectiveApproach,
      });

      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);

      const currentTime = new Date();
      const endDate = targetWindow.targetDateObj
        ? new Date(targetWindow.targetDateObj)
        : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      endDate.setHours(23, 59, 59, 999);

      const calendarEventsResult = await fetchCalendarEvents({
        endDate,
        provider,
        setConnectedCalendar,
        setConversationHistory,
        setShowCalendarModal,
        startDate,
      });

      if (calendarEventsResult.shouldAbort) {
        return;
      }

      const {
        busiestDays,
        calendarDataToSave,
        daysAnalysis,
        daysWithFreeTime,
        profileAvailability,
      } = analyzeStudyPlannerSlotCalendar({
        calendarEvents: calendarEventsResult.events,
        currentTime,
        effectiveApproach,
        effectiveTargetDate,
        startDate,
        targetDateObjForEvents: targetWindow.targetDateObj,
        userProfile: userProfileForAnalysis,
      });

      setSavedCalendarData(calendarDataToSave);

      const totalLessonsNeeded = selectedCourseIds.length > 0
        ? await calculateStudyPlannerTotalLessonsNeeded({ selectedCourseIds })
        : 0;

      const { finalSlots } = selectStudyPlannerFinalSlots({
        currentTime,
        daysAnalysis,
        hasOrganizationalDeadlines: Boolean(
          userProfile?.courses?.some((course) => Boolean(course?.dueDate)),
        ),
        profileAvailability,
        skipB2BRedirect,
        startDate,
        studyApproach: effectiveApproach,
        targetWindow,
        totalLessonsNeeded,
        userType: userContext?.userType || fetchedUserContext.userContext?.userType || null,
      });

      const pendingLessons = selectedCourseIds.length > 0
        ? await resolveStudyPlannerPendingLessonsForRecommendations({
            availableCourses,
            cachedPendingLessons:
              pendingLessonsRef.current.length > 0
                ? pendingLessonsRef.current
                : pendingLessonsWithNames,
            selectedCourseIds,
            userId,
          })
        : [];

      pendingLessonsRef.current = pendingLessons;
      setPendingLessonsWithNames(pendingLessons);

      const distributionResult = buildStudyPlannerLessonDistribution({
        approach: effectiveApproach,
        finalSlots,
        pendingLessons,
        targetDateObj: targetWindow.targetDateObj,
      });

      setSavedLessonDistribution(distributionResult.storedDistribution);
      setSavedTargetDate(effectiveTargetDate || null);
      setSavedTotalLessons(distributionResult.totalPendingLessons);

      const calendarMessage = buildStudyPlannerCalendarRecommendationMessage({
        busiestDays,
        calendarEventsCount: calendarEventsResult.events.length,
        distributionResult,
        effectiveApproach,
        effectiveTargetDate: effectiveTargetDate || null,
        finalSlots,
        profileAvailability,
        provider,
        userProfile,
      });

      appendCalendarRecommendationMessage(calendarMessage, setConversationHistory);

      if (isAudioEnabled) {
        await speakText(
          buildStudyPlannerAudioSummary({
            calendarEventsCount: calendarEventsResult.events.length,
            daysWithFreeTime,
            finalSlots,
          }),
        );
      }
    } catch (error) {
      console.error('Error analizando calendario:', error);

      const errorMessage = buildCalendarAnalysisErrorMessage(provider);
      setConversationHistory((previousHistory) => [
        ...previousHistory,
        { role: 'assistant', content: errorMessage },
      ]);

      if (isAudioEnabled) {
        await speakText('Calendario conectado. ¿Que dias y horarios prefieres para estudiar?');
      }
    } finally {
      globalThis.clearTimeout(processingTimeout);
      setIsProcessing(false);
    }
  };

  analyzeCalendarAndSuggestRef.current = analyzeCalendarAndSuggest;

  const disconnectCalendar = async (provider: CalendarProvider) => {
    try {
      setIsConnectingCalendar(true);

      const response = await fetch('/api/study-planner/calendar/disconnect', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al desconectar el calendario');
      }

      setConnectedCalendar(null);
      setShowCalendarModal(false);

      const disconnectMessage = `He desconectado tu calendario de ${getProviderName(provider)}. Puedes volver a conectarlo cuando lo desees.`;
      setConversationHistory((previousHistory) => [
        ...previousHistory,
        {
          role: 'assistant',
          content: disconnectMessage,
        },
      ]);

      if (isAudioEnabled) {
        await speakText(`Calendario de ${getProviderName(provider)} desconectado exitosamente.`);
      }
    } catch (error) {
      console.error('[disconnectCalendar] Error desconectando calendario:', error);
      const errorMessage = error instanceof Error
        ? error.message
        : 'Error desconocido al desconectar el calendario';

      setConversationHistory((previousHistory) => [
        ...previousHistory,
        {
          role: 'assistant',
          content: `No pude desconectar tu calendario. ${errorMessage}`,
        },
      ]);

      alert(`Error al desconectar calendario:\n\n${errorMessage}`);
    } finally {
      setIsConnectingCalendar(false);
    }
  };

  const skipCalendarConnection = async () => {
    setShowCalendarModal(false);
    setCalendarSkipped(true);
    setIsProcessing(true);
    setConversationHistory((previousHistory) => [
      ...previousHistory,
      {
        role: 'user',
        content: 'Prefiero no conectar mi calendario por ahora',
      },
    ]);

    try {
      const fetchedUserContext = await fetchStudyPlannerUserContext();
      const userProfile = fetchedUserContext.rawProfile;

      if (fetchedUserContext.userContext) {
        setUserContext(fetchedUserContext.userContext);
      }

      const profileInfo = buildSkippedCalendarProfileInfo(userProfile);
      const responseMessage = `Entendido, no hay problema.${profileInfo}\n\nCuentame:\n¿Que dias de la semana prefieres estudiar?\n¿En que horario te funciona mejor: manana, tarde o noche?\n\n(Por ejemplo: "Lunes, miercoles y viernes por la noche" o "Fines de semana por la manana")`;

      setConversationHistory((previousHistory) => [
        ...previousHistory,
        { role: 'assistant', content: responseMessage },
      ]);

      if (isAudioEnabled) {
        const audioMessage = userProfile?.professionalProfile?.rol?.nombre
          ? `Entendido. Veo que eres ${userProfile.professionalProfile.rol.nombre}. ¿Que dias y horarios prefieres para estudiar?`
          : 'Entendido. ¿Que dias y horarios prefieres para estudiar?';
        await speakText(audioMessage);
      }
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      const fallbackMessage = 'Entendido. Cuentame: ¿Que dias de la semana prefieres estudiar y en que horarios? (Por ejemplo: "Lunes a viernes por la noche")';
      setConversationHistory((previousHistory) => [
        ...previousHistory,
        { role: 'assistant', content: fallbackMessage },
      ]);

      if (isAudioEnabled) {
        await speakText(fallbackMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    analyzeCalendarAndSuggest,
    analyzeCalendarAndSuggestB2B,
    disconnectCalendar,
    skipCalendarConnection,
  };
}
