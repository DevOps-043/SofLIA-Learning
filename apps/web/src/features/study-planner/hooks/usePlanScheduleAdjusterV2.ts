import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import {
  extractDateChangeRequest,
  extractTimeChangeRequest,
  validateSchedulePlacementRules,
} from '../services/plan-adjustment.service';
import { resolvePlannerMessageIntent } from '../services/planner-message-intent.service';
import type {
  StudyPlannerCalendarProvider,
  StudyPlannerMessage,
} from '../types/planner-ui.types';
import type {
  StudyPlannerCalendarDataMap,
  StudyPlannerStoredLessonDistribution,
} from '../types/planner-schedule.types';
import {
  applyStudyPlanPatch,
  formatPlannerDisplayDate,
  getChangedSessionUpdates,
  syncUpdatedStudyPlanSessions,
} from './planner-message-handler.utils';

interface UsePlanScheduleAdjusterParams {
  connectedCalendar: StudyPlannerCalendarProvider;
  conversationHistory: StudyPlannerMessage[];
  isAudioEnabled: boolean;
  savedCalendarData: StudyPlannerCalendarDataMap | null;
  savedLessonDistribution: StudyPlannerStoredLessonDistribution[];
  savedPlanId: string | null;
  setConversationHistory: Dispatch<SetStateAction<StudyPlannerMessage[]>>;
  setSavedLessonDistribution: Dispatch<SetStateAction<StudyPlannerStoredLessonDistribution[]>>;
  setSavedPlanId: Dispatch<SetStateAction<string | null>>;
  speakText: (text: string) => Promise<void>;
}

export function usePlanScheduleAdjusterV2(params: UsePlanScheduleAdjusterParams) {
  const applyCanonicalSessionUpdates = useCallback((
    distribution: StudyPlannerStoredLessonDistribution[],
    updatedSessions: Array<{
      id: string;
      clientReferenceId?: string;
      startTime: string;
      endTime: string;
    }>,
  ) => {
    if (updatedSessions.length === 0) {
      return distribution;
    }

    const byClientReferenceId = new Map(
      updatedSessions
        .filter((session) => session.clientReferenceId)
        .map((session) => [session.clientReferenceId as string, session]),
    );
    const bySessionId = new Map(updatedSessions.map((session) => [session.id, session]));

    return distribution.map((slot) => {
      const canonicalSession =
        byClientReferenceId.get(slot.clientReferenceId)
        || (slot.sessionId ? bySessionId.get(slot.sessionId) : undefined);

      if (!canonicalSession) {
        return slot;
      }

      const canonicalStart = new Date(canonicalSession.startTime);
      const canonicalEnd = new Date(canonicalSession.endTime);

      return {
        ...slot,
        sessionId: canonicalSession.id,
        dateStr: `${canonicalStart.getFullYear()}-${String(canonicalStart.getMonth() + 1).padStart(2, '0')}-${String(canonicalStart.getDate()).padStart(2, '0')}`,
        dayName: canonicalStart.toLocaleDateString('es-ES', { weekday: 'long' }),
        startTime: `${String(canonicalStart.getHours()).padStart(2, '0')}:${String(canonicalStart.getMinutes()).padStart(2, '0')}`,
        endTime: `${String(canonicalEnd.getHours()).padStart(2, '0')}:${String(canonicalEnd.getMinutes()).padStart(2, '0')}`,
      };
    });
  }, []);

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

    if (!timeChange || params.savedLessonDistribution.length === 0) {
      return false;
    }

    const conflicts: Array<{ date: string; time: string; reason: string }> = [];
    const updatedDistribution = [...params.savedLessonDistribution];

    params.savedLessonDistribution.forEach((slot, index) => {
      if (!slot.startTime || !slot.endTime) return;

      const originalTimeMatch = slot.startTime.match(/(\d{1,2}):(\d{2})/);
      const originalEndTimeMatch = slot.endTime.match(/(\d{1,2}):(\d{2})/);
      if (!originalTimeMatch || !originalEndTimeMatch) return;

      const originalHour = Number.parseInt(originalTimeMatch[1], 10);
      const originalMinute = Number.parseInt(originalTimeMatch[2], 10);
      if (originalHour !== timeChange.oldHour) return;

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
      const durationMinutes =
        (originalEndHour * 60 + originalEndMinute) - (originalHour * 60 + originalMinute);

      const newEndTime = new Date(newStartTime);
      newEndTime.setMinutes(newEndTime.getMinutes() + durationMinutes);

      const candidateSlot = {
        ...slot,
        startTime: `${String(newStartTime.getHours()).padStart(2, '0')}:${String(newStartTime.getMinutes()).padStart(2, '0')}`,
        endTime: `${String(newEndTime.getHours()).padStart(2, '0')}:${String(newEndTime.getMinutes()).padStart(2, '0')}`,
      };
      const validation = validateSchedulePlacementRules({
        savedCalendarData: params.savedCalendarData,
        savedLessonDistribution: updatedDistribution,
        targetSlot: candidateSlot,
        userMessage: rawMessage,
      });

      if (!validation.valid) {
        conflicts.push({
          date: slot.dateStr,
          time: `${String(timeChange.newHour ?? originalHour).padStart(2, '0')}:${String(originalMinute).padStart(2, '0')}`,
          reason: validation.message || 'Hay un conflicto con el calendario.',
        });
        return;
      }

      updatedDistribution[index] = candidateSlot;
    });

    if (conflicts.length > 0) {
      let conflictMessage = `He detectado que algunos de los horarios que quieres cambiar (de ${timeChange.oldHour}:00 a ${timeChange.newHour}:00) no se pueden mover de forma segura:\n\n`;
      conflicts.forEach((conflict) => {
        const dateObj = new Date(conflict.date);
        const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
        const formattedDate = dateObj.toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
        });
        conflictMessage += `- ${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${formattedDate} a las ${conflict.time}: ${conflict.reason}\n`;
      });
      conflictMessage += '\nSi quieres, puedo intentar otro horario dentro de bloques de trabajo o dejar esas sesiones como estaban.';
      params.setConversationHistory((prev) => [
        ...prev,
        { role: 'assistant', content: conflictMessage },
      ]);
      if (params.isAudioEnabled) {
        await params.speakText(
          'He detectado conflictos con el calendario o con tus bloques de trabajo.',
        );
      }
      return true;
    }

    const updates = getChangedSessionUpdates(updatedDistribution, params.savedLessonDistribution);
    if (updates.length === 0) return false;

    const planIdToUse = await syncUpdatedStudyPlanSessions({
      connectedCalendar: params.connectedCalendar,
      savedPlanId: params.savedPlanId,
      setConversationHistory: params.setConversationHistory,
      setSavedPlanId: params.setSavedPlanId,
      updates,
    });

    params.setSavedLessonDistribution(updatedDistribution);

    const updatedCount = updates.length;
    const updateMessage = planIdToUse
      ? `He actualizado ${updatedCount} horario${updatedCount > 1 ? 's' : ''} de ${timeChange.oldHour}:00 a ${timeChange.newHour}:00. Los cambios ya estan guardados en tu plan.`
      : `He actualizado ${updatedCount} horario${updatedCount > 1 ? 's' : ''} de ${timeChange.oldHour}:00 a ${timeChange.newHour}:00. Los cambios se aplicaran cuando guardes el plan.`;

    params.setConversationHistory((prev) => [
      ...prev,
      { role: 'assistant', content: updateMessage },
    ]);

    if (params.isAudioEnabled) {
      await params.speakText(
        `He actualizado ${updatedCount} horario${updatedCount > 1 ? 's' : ''} como solicitaste.`,
      );
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

    if (!dateChange || params.savedLessonDistribution.length === 0) return false;

    const sessionsToMove = params.savedLessonDistribution.filter(
      (session) => session.dateStr === dateChange.sourceDate,
    );

    if (sessionsToMove.length === 0) {
      const sourceDateObj = new Date(dateChange.sourceDate);
      const message = `No encontre sesiones programadas para el ${dateChange.sourceDayName} ${sourceDateObj.getDate()}. Podrias verificar la fecha?`;
      params.setConversationHistory((prev) => [
        ...prev,
        { role: 'user', content: rawMessage },
        { role: 'assistant', content: message },
      ]);
      return true;
    }

    const conflicts: Array<{ time: string; reason: string }> = [];
    const movedClientReferenceIds: string[] = [];
    const nextDistribution = [...params.savedLessonDistribution];

    params.savedLessonDistribution.forEach((slot, index) => {
      if (slot.dateStr !== dateChange.sourceDate) {
        return;
      }

      const candidateSlot = {
        ...slot,
        dateStr: dateChange.targetDate,
        dayName: dateChange.targetDayName,
      };
      const validation = validateSchedulePlacementRules({
        savedCalendarData: params.savedCalendarData,
        savedLessonDistribution: nextDistribution,
        targetSlot: candidateSlot,
        userMessage: rawMessage,
      });

      if (!validation.valid) {
        conflicts.push({
          time: slot.startTime,
          reason: validation.message || 'Hay un conflicto con el calendario.',
        });
        return;
      }

      nextDistribution[index] = candidateSlot;
      movedClientReferenceIds.push(slot.clientReferenceId);
    });

    const updatedDistribution = nextDistribution.sort((left, right) => {
      const dateCompare = left.dateStr.localeCompare(right.dateStr);
      return dateCompare !== 0 ? dateCompare : left.startTime.localeCompare(right.startTime);
    });

    const updates = getChangedSessionUpdates(updatedDistribution, params.savedLessonDistribution);
    const patchResult = updates.length > 0
      ? await applyStudyPlanPatch({
        savedPlanId: params.savedPlanId,
        setSavedPlanId: params.setSavedPlanId,
        operations: [
          {
            type: 'move_day',
            sourceDate: dateChange.sourceDate,
            targetDate: dateChange.targetDate,
            clientReferenceIds: movedClientReferenceIds,
          },
        ],
      })
      : {
        success: false,
        planId: params.savedPlanId,
        updatedSessions: [],
        errors: [],
      };

    const canonicalDistribution = patchResult.updatedSessions.length > 0
      ? applyCanonicalSessionUpdates(updatedDistribution, patchResult.updatedSessions)
      : updatedDistribution;

    params.setSavedLessonDistribution(canonicalDistribution);

    if (patchResult.errors.length > 0) {
      params.setConversationHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: patchResult.errors.join('\n'),
        },
      ]);
    }

    const planIdToUse = patchResult.planId;

    const targetDateLabel = formatPlannerDisplayDate(
      dateChange.targetDate,
      dateChange.targetDayName,
    );
    const movedSessions = sessionsToMove.filter((session) => movedClientReferenceIds.includes(session.clientReferenceId));
    const movedCount = movedSessions.length;
    const totalLessons = movedSessions.reduce(
      (sum, session) => sum + (session.lessons?.length ?? 0),
      0,
    );
    const persistenceMessage = planIdToUse
      ? patchResult.success
        ? ' Los cambios ya estan guardados en tu plan.'
        : ' Hice el ajuste visual, pero hubo problemas al persistir una parte del cambio.'
      : ' Los cambios se aplicaran cuando guardes el plan.';
    let assistantMessage = movedCount > 0
      ? `He movido ${movedCount} sesion${movedCount > 1 ? 'es' : ''} (${totalLessons} lecciones) del ${dateChange.sourceDayName} al ${targetDateLabel}. Los horarios se mantienen igual.${persistenceMessage}`
      : `No pude mover las sesiones del ${dateChange.sourceDayName} al ${targetDateLabel} sin romper las reglas del calendario o de trabajo.`;

    if (conflicts.length > 0) {
      const details = conflicts
        .map((conflict) => `- ${conflict.time}: ${conflict.reason}`)
        .join('\n');
      assistantMessage += `\n\nEstas sesiones se quedaron en su lugar:\n${details}`;
    }

    assistantMessage += '\n\nTe parece bien o quieres hacer algun otro cambio?';

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
    params.savedCalendarData,
    params.savedLessonDistribution,
    params.savedPlanId,
    params.setConversationHistory,
    params.setSavedLessonDistribution,
    params.setSavedPlanId,
    params.speakText,
    applyCanonicalSessionUpdates,
  ]);

  return { handleTimeChange, handleDateChange };
}
