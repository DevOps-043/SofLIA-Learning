import { useCallback } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { LessonData } from './useSofLIAData';
import { applyPlannerPreSendGuardrails } from '../services/planner-guardrails.service';
import { buildStudyPlannerChatRequestContext, sendStudyPlannerChatRequest } from '../services/planner-chat-request.service';
import { processStudyPlannerChatResponse, shouldTriggerPlannerFinalSave } from '../services/planner-chat-response.service';
import { extractDateChangeRequest, extractTimeChangeRequest, validateScheduleConflict } from '../services/plan-adjustment.service';
import {
  buildAddScheduleContext,
  buildChangeTargetDateContext,
  buildFinalPlanSummaryContext,
} from '../services/planner-message-context.service';
import { resolvePlannerMessageIntent } from '../services/planner-message-intent.service';
import {
  detectStudyPlannerApproachFromMessage,
  looksLikeStudyPlannerTargetDateMessage,
} from '../services/planner-input-detection.service';
import type {
  StudyApproach,
  StudyPlannerAssignedCourse,
  StudyPlannerCalendarProvider,
  StudyPlannerCourseOption,
  StudyPlannerMessage,
  StudyPlannerPendingLesson,
  StudyPlannerUserContext,
} from '../types/planner-ui.types';
import type {
  StudyPlannerCalendarDataMap,
  StudyPlannerStoredLessonDistribution,
} from '../types/planner-schedule.types';

interface StudyPlannerMessageHandlerLiaData {
  getLessonsForPrompt: () => string;
  isReady: boolean;
  lessons: LessonData[];
  totalPending: number;
}

interface UseStudyPlannerMessageHandlerParams {
  availableCourses: StudyPlannerCourseOption[];
  assignedCourses: StudyPlannerAssignedCourse[];
  connectedCalendar: StudyPlannerCalendarProvider;
  conversationHistory: StudyPlannerMessage[];
  executeFinalPlanSave: () => Promise<void>;
  hasAskedApproach: boolean;
  hasAskedTargetDate: boolean;
  hasShownFinalSummary: boolean;
  isAudioEnabled: boolean;
  isProcessing: boolean;
  liaConversationId: string | null;
  liaData: StudyPlannerMessageHandlerLiaData;
  loadUserCourses: () => void;
  onStudyApproachResponse: (approach: StudyApproach) => Promise<void>;
  onTargetDateResponse: (value: string) => Promise<void>;
  pendingLessonsRef: MutableRefObject<StudyPlannerPendingLesson[]>;
  savedCalendarData: StudyPlannerCalendarDataMap | null;
  savedLessonDistribution: StudyPlannerStoredLessonDistribution[];
  savedPlanId: string | null;
  savedTargetDate: string | null;
  savedTotalLessons: number;
  selectedCourseIds: string[];
  setConversationHistory: Dispatch<SetStateAction<StudyPlannerMessage[]>>;
  setHasShownFinalSummary: Dispatch<SetStateAction<boolean>>;
  setIsProcessing: Dispatch<SetStateAction<boolean>>;
  setLiaConversationId: Dispatch<SetStateAction<string | null>>;
  setSavedLessonDistribution: Dispatch<SetStateAction<StudyPlannerStoredLessonDistribution[]>>;
  setSavedPlanId: Dispatch<SetStateAction<string | null>>;
  setStudyApproach: Dispatch<SetStateAction<StudyApproach | null>>;
  setTargetDate: Dispatch<SetStateAction<string | null>>;
  showDateModal: boolean;
  speakText: (text: string) => Promise<void>;
  stopAllAudio: () => void;
  studyApproach: StudyApproach | null;
  targetDate: string | null;
  userContext: StudyPlannerUserContext | null;
}

interface PlannerSessionTimeUpdate {
  dateStr: string;
  originalStartTime: string;
  newStartTime: string;
  newEndTime: string;
}

function formatPlannerDisplayDate(dateStr: string, dayName: string): string {
  const [yearRaw, monthRaw, dayRaw] = dateStr.split('-');
  const year = Number.parseInt(yearRaw, 10);
  const month = Number.parseInt(monthRaw, 10) - 1;
  const day = Number.parseInt(dayRaw, 10);

  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return `${dayName} ${dateStr}`;
  }

  const monthNames = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ];
  const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);

  return `${capitalizedDay} ${day} de ${monthNames[month] ?? monthRaw} de ${year}`;
}

function getChangedSessionUpdates(
  updatedDistribution: StudyPlannerStoredLessonDistribution[],
  savedLessonDistribution: StudyPlannerStoredLessonDistribution[],
): PlannerSessionTimeUpdate[] {
  return updatedDistribution
    .map((slot, index) => {
      const original = savedLessonDistribution[index];

      if (
        !original
        || !original.startTime
        || !slot.startTime
        || !slot.endTime
        || (slot.startTime === original.startTime && slot.endTime === original.endTime)
      ) {
        return null;
      }

      return {
        dateStr: slot.dateStr,
        originalStartTime: original.startTime,
        newStartTime: slot.startTime,
        newEndTime: slot.endTime,
      };
    })
    .filter((update): update is PlannerSessionTimeUpdate => update !== null);
}

async function getActivePlanId(savedPlanId: string | null): Promise<string | null> {
  if (savedPlanId) {
    return savedPlanId;
  }

  try {
    const response = await fetch('/api/study-planner/active-plan');
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { planId?: string | null };
    return payload.planId ?? null;
  } catch (error) {
    console.warn('No se pudo obtener el plan activo para sincronizar sesiones:', error);
    return null;
  }
}

async function syncUpdatedStudyPlanSessions(params: {
  connectedCalendar: StudyPlannerCalendarProvider;
  savedPlanId: string | null;
  setConversationHistory: Dispatch<SetStateAction<StudyPlannerMessage[]>>;
  setSavedPlanId: Dispatch<SetStateAction<string | null>>;
  updates: PlannerSessionTimeUpdate[];
}): Promise<string | null> {
  const planIdToUse = await getActivePlanId(params.savedPlanId);

  if (!planIdToUse) {
    return null;
  }

  if (!params.savedPlanId) {
    params.setSavedPlanId(planIdToUse);
  }

  if (params.updates.length === 0) {
    return planIdToUse;
  }

  try {
    const updateResponse = await fetch('/api/study-planner/sessions/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: planIdToUse,
        updates: params.updates,
      }),
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error(`Error actualizando sesiones en BD (${updateResponse.status}):`, errorText);
      params.setConversationHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Error al actualizar los horarios en la base de datos. Por favor, intenta guardar el plan de nuevo.',
        },
      ]);
      return planIdToUse;
    }

    const updateData = await updateResponse.json() as {
      success?: boolean;
      data?: {
        updatedCount?: number;
        totalUpdates?: number;
        errors?: unknown[];
      };
    };

    if (!updateData.success) {
      params.setConversationHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'No se pudieron actualizar los horarios en la base de datos. Por favor, intenta guardar el plan de nuevo.',
        },
      ]);
      return planIdToUse;
    }

    if ((updateData.data?.errors?.length ?? 0) > 0) {
      const updatedCount = updateData.data?.updatedCount ?? 0;
      const totalUpdates = updateData.data?.totalUpdates ?? params.updates.length;

      params.setConversationHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Se actualizaron ${updatedCount} de ${totalUpdates} horarios. Algunos no se pudieron actualizar.`,
        },
      ]);
    }

    if (params.connectedCalendar) {
      params.setConversationHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Los horarios se han actualizado en tu plan. Si tienes eventos en el calendario, es posible que necesites actualizarlos manualmente o re-sincronizar.',
        },
      ]);
    }

    return planIdToUse;
  } catch (error) {
    console.error('Error actualizando sesiones en BD:', error);
    return planIdToUse;
  }
}

export function useStudyPlannerMessageHandler(
  params: UseStudyPlannerMessageHandlerParams,
) {
  const handleTimeChange = useCallback(async (rawMessage: string): Promise<boolean> => {
    const lowerMessage = rawMessage.toLowerCase();
    const isAddingSchedules = resolvePlannerMessageIntent({
      message: rawMessage,
      lowerMessage,
      conversationHistory: params.conversationHistory,
      hasSavedDistribution: params.savedLessonDistribution.length > 0,
    }).isAddingSchedules;

    const isExplicitChange = ['cambiar', 'cambia', 'ajustar', 'modificar', 'mover', 'cambiame']
      .some((token) => lowerMessage.includes(token));

    const timeChange = !isAddingSchedules && isExplicitChange
      ? extractTimeChangeRequest(rawMessage)
      : null;

    if (!timeChange || params.savedLessonDistribution.length === 0 || !params.savedCalendarData) {
      return false;
    }

    const conflicts: Array<{ date: string; time: string; title: string }> = [];

    const updatedDistribution = params.savedLessonDistribution.map((slot) => {
      if (!slot.startTime || !slot.endTime) {
        return slot;
      }

      const originalTimeMatch = slot.startTime.match(/(\d{1,2}):(\d{2})/);
      const originalEndTimeMatch = slot.endTime.match(/(\d{1,2}):(\d{2})/);

      if (!originalTimeMatch || !originalEndTimeMatch) {
        return slot;
      }

      const originalHour = Number.parseInt(originalTimeMatch[1], 10);
      const originalMinute = Number.parseInt(originalTimeMatch[2], 10);

      if (originalHour !== timeChange.oldHour) {
        return slot;
      }

      const [yearRaw, monthRaw, dayRaw] = slot.dateStr.split('-');
      const slotDate = new Date(
        Number.parseInt(yearRaw, 10),
        Number.parseInt(monthRaw, 10) - 1,
        Number.parseInt(dayRaw, 10),
      );
      const newStartTime = new Date(slotDate);
      newStartTime.setHours(timeChange.newHour ?? originalHour, originalMinute, 0, 0);

      const originalEndHour = Number.parseInt(originalEndTimeMatch[1], 10);
      const originalEndMinute = Number.parseInt(originalEndTimeMatch[2], 10);
      const durationMinutes = (originalEndHour * 60 + originalEndMinute) - (originalHour * 60 + originalMinute);
      const newEndTime = new Date(newStartTime);
      newEndTime.setMinutes(newEndTime.getMinutes() + durationMinutes);

      const validation = validateScheduleConflict(params.savedCalendarData, slotDate, newStartTime, newEndTime);
      if (validation.hasConflict) {
        const title = validation.conflictingEvent?.summary || validation.conflictingEvent?.title || 'Evento programado';
        conflicts.push({
          date: slot.dateStr,
          time: `${String(timeChange.newHour ?? originalHour).padStart(2, '0')}:${String(originalMinute).padStart(2, '0')}`,
          title,
        });
        return slot;
      }

      return {
        ...slot,
        startTime: `${String(newStartTime.getHours()).padStart(2, '0')}:${String(newStartTime.getMinutes()).padStart(2, '0')}`,
        endTime: `${String(newEndTime.getHours()).padStart(2, '0')}:${String(newEndTime.getMinutes()).padStart(2, '0')}`,
      };
    });

    if (conflicts.length > 0) {
      let conflictMessage = `He detectado que algunos de los horarios que quieres cambiar (de ${timeChange.oldHour}:00 a ${timeChange.newHour}:00) chocan con eventos en tu calendario:\n\n`;

      conflicts.forEach((conflict) => {
        const dateObj = new Date(conflict.date);
        const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
        const formattedDate = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
        conflictMessage += `- ${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${formattedDate} a las ${conflict.time}: Tienes "${conflict.title}" programado\n`;
      });

      conflictMessage += '\n¿Te gustaría que ajuste esos horarios a otros momentos disponibles ese día, o prefieres mantener los horarios originales?';

      params.setConversationHistory((prev) => [...prev, { role: 'assistant', content: conflictMessage }]);

      if (params.isAudioEnabled) {
        await params.speakText('He detectado conflictos con tu calendario. Algunos horarios chocan con eventos programados.');
      }

      return true;
    }

    const updates = getChangedSessionUpdates(updatedDistribution, params.savedLessonDistribution);
    if (updates.length === 0) {
      return false;
    }

    params.setSavedLessonDistribution(updatedDistribution);

    const planIdToUse = await syncUpdatedStudyPlanSessions({
      connectedCalendar: params.connectedCalendar,
      savedPlanId: params.savedPlanId,
      setConversationHistory: params.setConversationHistory,
      setSavedPlanId: params.setSavedPlanId,
      updates,
    });

    const updatedCount = updates.length;
    const updateMessage = planIdToUse
      ? `He actualizado ${updatedCount} horario${updatedCount > 1 ? 's' : ''} de ${timeChange.oldHour}:00 a ${timeChange.newHour}:00. Los cambios ya están guardados en tu plan.`
      : `He actualizado ${updatedCount} horario${updatedCount > 1 ? 's' : ''} de ${timeChange.oldHour}:00 a ${timeChange.newHour}:00. Los cambios se aplicarán cuando guardes el plan.`;

    params.setConversationHistory((prev) => [...prev, { role: 'assistant', content: updateMessage }]);

    if (params.isAudioEnabled) {
      await params.speakText(`He actualizado ${updatedCount} horario${updatedCount > 1 ? 's' : ''} como solicitaste.`);
    }

    return true;
  }, [
    params.connectedCalendar,
    params.conversationHistory,
    params.isAudioEnabled,
    params.savedCalendarData,
    params.savedLessonDistribution,
    params.savedPlanId,
    params.setConversationHistory,
    params.setSavedLessonDistribution,
    params.setSavedPlanId,
    params.speakText,
  ]);

  const handleDateChange = useCallback(async (rawMessage: string): Promise<boolean> => {
    const lowerMessage = rawMessage.toLowerCase();
    const intentResolution = resolvePlannerMessageIntent({
      message: rawMessage,
      lowerMessage,
      conversationHistory: params.conversationHistory,
      hasSavedDistribution: params.savedLessonDistribution.length > 0,
    });
    const isExplicitChange = ['cambiar', 'cambia', 'ajustar', 'modificar', 'mover', 'cambiame']
      .some((token) => lowerMessage.includes(token));

    const dateChange = !intentResolution.isAddingSchedules && isExplicitChange
      ? extractDateChangeRequest(rawMessage, params.savedLessonDistribution)
      : null;

    if (!dateChange || params.savedLessonDistribution.length === 0) {
      return false;
    }

    const sessionsToMove = params.savedLessonDistribution.filter((session) => session.dateStr === dateChange.sourceDate);

    if (sessionsToMove.length === 0) {
      const sourceDateObj = new Date(dateChange.sourceDate);
      const message = `No encontré sesiones programadas para el ${dateChange.sourceDayName} ${sourceDateObj.getDate()}. ¿Podrías verificar la fecha?`;

      params.setConversationHistory((prev) => [
        ...prev,
        { role: 'user', content: rawMessage },
        { role: 'assistant', content: message },
      ]);

      return true;
    }

    const updatedDistribution = params.savedLessonDistribution
      .map((slot) => (
        slot.dateStr === dateChange.sourceDate
          ? { ...slot, dateStr: dateChange.targetDate, dayName: dateChange.targetDayName }
          : slot
      ))
      .sort((left, right) => {
        const dateCompare = left.dateStr.localeCompare(right.dateStr);
        return dateCompare !== 0 ? dateCompare : left.startTime.localeCompare(right.startTime);
      });

    params.setSavedLessonDistribution(updatedDistribution);

    const targetDateLabel = formatPlannerDisplayDate(dateChange.targetDate, dateChange.targetDayName);
    const movedCount = sessionsToMove.length;
    const totalLessons = sessionsToMove.reduce((sum, session) => sum + (session.lessons?.length ?? 0), 0);
    const assistantMessage = `He movido ${movedCount} sesion${movedCount > 1 ? 'es' : ''} (${totalLessons} lecciones) del ${dateChange.sourceDayName} al ${targetDateLabel}. Los horarios se mantienen igual.\n\n¿Te parece bien o quieres hacer algún otro cambio?`;

    params.setConversationHistory((prev) => [
      ...prev,
      { role: 'user', content: rawMessage },
      { role: 'assistant', content: assistantMessage },
    ]);

    if (params.isAudioEnabled) {
      await params.speakText(`He movido ${movedCount} sesiones al ${targetDateLabel}.`);
    }

    return true;
  }, [
    params.conversationHistory,
    params.isAudioEnabled,
    params.savedLessonDistribution,
    params.setConversationHistory,
    params.setSavedLessonDistribution,
    params.speakText,
  ]);

  const handleSendMessage = useCallback(async (message: string) => {
    const rawMessage = message.trim();
    if (!rawMessage || params.isProcessing) {
      return;
    }

    params.stopAllAudio();

    if (await handleTimeChange(rawMessage)) {
      return;
    }

    if (await handleDateChange(rawMessage)) {
      return;
    }

    const lowerMessage = rawMessage.toLowerCase();
    const intentResolution = resolvePlannerMessageIntent({
      message: rawMessage,
      lowerMessage,
      conversationHistory: params.conversationHistory,
      hasSavedDistribution: params.savedLessonDistribution.length > 0,
    });

    const plannerContextParams = {
      availableCourses: params.availableCourses,
      selectedCourseIds: params.selectedCourseIds,
      savedLessonDistribution: params.savedLessonDistribution,
      savedTargetDate: params.savedTargetDate,
      savedTotalLessons: params.savedTotalLessons,
      userType: params.userContext?.userType ?? null,
      savedCalendarData: params.savedCalendarData,
    };

    let enrichedMessage = intentResolution.resolvedMessage;

    if (intentResolution.isConfirmingSchedules && !params.hasShownFinalSummary) {
      enrichedMessage = `${intentResolution.resolvedMessage}${buildFinalPlanSummaryContext(plannerContextParams)}`;
    } else if (intentResolution.isAddingSchedules) {
      enrichedMessage = `${intentResolution.resolvedMessage}${buildAddScheduleContext(plannerContextParams)}`;
    } else if (intentResolution.isChangingTargetDate) {
      enrichedMessage = `${intentResolution.resolvedMessage}${buildChangeTargetDateContext(plannerContextParams)}`;
    }

    const newHistory = [...params.conversationHistory, { role: 'user', content: rawMessage }];
    params.setConversationHistory(newHistory);
    params.setIsProcessing(true);

    try {
      const preSendGuardrail = applyPlannerPreSendGuardrails({
        message: rawMessage,
        enrichedMessage,
        conversationHistory: params.conversationHistory,
      });

      enrichedMessage = preSendGuardrail.enrichedMessage;

      if (preSendGuardrail.blocked) {
        params.setConversationHistory((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: preSendGuardrail.assistantMessage ?? 'No pude procesar ese mensaje.',
          },
        ]);
        return;
      }

      const { systemPrompt } = await buildStudyPlannerChatRequestContext({
        message: intentResolution.resolvedMessage,
        userName: params.userContext?.userName || undefined,
        lessonsAreReady: params.liaData.isReady,
        lessons: params.liaData.lessons,
        getLessonsForPrompt: params.liaData.getLessonsForPrompt,
        pendingLessons: params.pendingLessonsRef.current,
        totalPendingLessons: params.liaData.totalPending || params.pendingLessonsRef.current.length,
        assignedCourses: params.assignedCourses,
        connectedCalendar: params.connectedCalendar,
        studyApproach: params.studyApproach,
        savedLessonDistribution: params.savedLessonDistribution,
      });

      const data = await sendStudyPlannerChatRequest({
        message: enrichedMessage,
        conversationHistory: newHistory.slice(-10),
        systemPrompt,
        userName: params.userContext?.userName || undefined,
      });

      let liaResponse = data.response;
      if (data.conversationId && !params.liaConversationId) {
        params.setLiaConversationId(data.conversationId);
      }

      const processedResponse = processStudyPlannerChatResponse({
        liaResponse,
        savedLessonDistribution: params.savedLessonDistribution,
        isAddingSchedules: intentResolution.isAddingSchedules,
        isConfirmingSchedules: intentResolution.isConfirmingSchedules,
        hasShownFinalSummary: params.hasShownFinalSummary,
      });

      liaResponse = processedResponse.sanitizedResponse;
      params.setConversationHistory((prev) => [...prev, { role: 'assistant', content: liaResponse }]);

      if (processedResponse.hasExtractedSchedules) {
        params.setSavedLessonDistribution(processedResponse.nextSavedLessonDistribution);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (processedResponse.shouldMarkFinalSummaryShown) {
        params.setHasShownFinalSummary(true);
      }

      if (processedResponse.shouldOpenCourseSelector) {
        setTimeout(() => {
          params.loadUserCourses();
        }, 500);
      }

      if (params.hasAskedApproach && !params.studyApproach) {
        const detectedApproach = detectStudyPlannerApproachFromMessage(rawMessage);
        if (detectedApproach) {
          params.setStudyApproach(detectedApproach);
          await params.onStudyApproachResponse(detectedApproach);
          return;
        }
      }

      if (
        params.hasAskedTargetDate
        && !params.targetDate
        && params.studyApproach
        && !params.showDateModal
        && looksLikeStudyPlannerTargetDateMessage(rawMessage)
      ) {
        params.setTargetDate(rawMessage);
        await params.onTargetDateResponse(rawMessage);
        return;
      }

      if (shouldTriggerPlannerFinalSave({
        userMessage: rawMessage,
        liaResponse,
        savedLessonDistributionCount: processedResponse.nextSavedLessonDistribution.length,
      })) {
        setTimeout(() => {
          void params.executeFinalPlanSave();
        }, 2000);
      }

      if (params.isAudioEnabled) {
        await params.speakText(liaResponse);
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      params.setConversationHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Lo siento, tuve un problema procesando tu mensaje. ¿Podrías intentarlo de nuevo?',
        },
      ]);
    } finally {
      params.setIsProcessing(false);
    }
  }, [
    handleDateChange,
    handleTimeChange,
    params.assignedCourses,
    params.availableCourses,
    params.connectedCalendar,
    params.conversationHistory,
    params.executeFinalPlanSave,
    params.hasAskedApproach,
    params.hasAskedTargetDate,
    params.hasShownFinalSummary,
    params.isAudioEnabled,
    params.isProcessing,
    params.liaConversationId,
    params.liaData.getLessonsForPrompt,
    params.liaData.isReady,
    params.liaData.lessons,
    params.liaData.totalPending,
    params.loadUserCourses,
    params.onStudyApproachResponse,
    params.onTargetDateResponse,
    params.pendingLessonsRef,
    params.savedCalendarData,
    params.savedLessonDistribution,
    params.savedTargetDate,
    params.savedTotalLessons,
    params.selectedCourseIds,
    params.setConversationHistory,
    params.setHasShownFinalSummary,
    params.setIsProcessing,
    params.setLiaConversationId,
    params.setSavedLessonDistribution,
    params.setStudyApproach,
    params.setTargetDate,
    params.showDateModal,
    params.speakText,
    params.stopAllAudio,
    params.studyApproach,
    params.targetDate,
    params.userContext,
  ]);

  return {
    handleSendMessage,
  };
}
