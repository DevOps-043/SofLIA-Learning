import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { extractDateChangeRequest, extractTimeChangeRequest, validateScheduleConflict } from '../services/plan-adjustment.service';
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

export function usePlanScheduleAdjuster(params: UsePlanScheduleAdjusterParams) {
  const handleTimeChange = useCallback(async (rawMessage: string): Promise<boolean> => {
    const lowerMessage = rawMessage.toLowerCase();
    const isAddingSchedules = resolvePlannerMessageIntent({
      message: rawMessage,
      lowerMessage,
      conversationHistory: params.conversationHistory,
      hasSavedDistribution: params.savedLessonDistribution.length > 0,
    }).isAddingSchedules;

    const isExplicitChange = ['cambiar', 'cambia', 'ajustar', 'modificar', 'mover', 'cambiame']
      .some(token => lowerMessage.includes(token));

    const timeChange = !isAddingSchedules && isExplicitChange
      ? extractTimeChangeRequest(rawMessage)
      : null;

    if (!timeChange || params.savedLessonDistribution.length === 0 || !params.savedCalendarData) {
      return false;
    }

    const conflicts: Array<{ date: string; time: string; title: string }> = [];

    const updatedDistribution = params.savedLessonDistribution.map(slot => {
      if (!slot.startTime || !slot.endTime) return slot;
      const originalTimeMatch = slot.startTime.match(/(\d{1,2}):(\d{2})/);
      const originalEndTimeMatch = slot.endTime.match(/(\d{1,2}):(\d{2})/);
      if (!originalTimeMatch || !originalEndTimeMatch) return slot;

      const originalHour = Number.parseInt(originalTimeMatch[1], 10);
      const originalMinute = Number.parseInt(originalTimeMatch[2], 10);
      if (originalHour !== timeChange.oldHour) return slot;

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
      conflicts.forEach(conflict => {
        const dateObj = new Date(conflict.date);
        const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
        const formattedDate = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
        conflictMessage += `- ${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${formattedDate} a las ${conflict.time}: Tienes "${conflict.title}" programado\n`;
      });
      conflictMessage += '\n¿Te gustaría que ajuste esos horarios a otros momentos disponibles ese día, o prefieres mantener los horarios originales?';
      params.setConversationHistory(prev => [...prev, { role: 'assistant', content: conflictMessage }]);
      if (params.isAudioEnabled) {
        await params.speakText('He detectado conflictos con tu calendario. Algunos horarios chocan con eventos programados.');
      }
      return true;
    }

    const updates = getChangedSessionUpdates(updatedDistribution, params.savedLessonDistribution);
    if (updates.length === 0) return false;

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

    params.setConversationHistory(prev => [...prev, { role: 'assistant', content: updateMessage }]);
    if (params.isAudioEnabled) {
      await params.speakText(`He actualizado ${updatedCount} horario${updatedCount > 1 ? 's' : ''} como solicitaste.`);
    }
    return true;
  }, [
    params.connectedCalendar, params.conversationHistory, params.isAudioEnabled,
    params.savedCalendarData, params.savedLessonDistribution, params.savedPlanId,
    params.setConversationHistory, params.setSavedLessonDistribution,
    params.setSavedPlanId, params.speakText,
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
      .some(token => lowerMessage.includes(token));

    const dateChange = !intentResolution.isAddingSchedules && isExplicitChange
      ? extractDateChangeRequest(rawMessage, params.savedLessonDistribution)
      : null;

    if (!dateChange || params.savedLessonDistribution.length === 0) return false;

    const sessionsToMove = params.savedLessonDistribution.filter(
      session => session.dateStr === dateChange.sourceDate,
    );

    if (sessionsToMove.length === 0) {
      const sourceDateObj = new Date(dateChange.sourceDate);
      const message = `No encontré sesiones programadas para el ${dateChange.sourceDayName} ${sourceDateObj.getDate()}. ¿Podrías verificar la fecha?`;
      params.setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: rawMessage },
        { role: 'assistant', content: message },
      ]);
      return true;
    }

    const updatedDistribution = params.savedLessonDistribution
      .map(slot =>
        slot.dateStr === dateChange.sourceDate
          ? { ...slot, dateStr: dateChange.targetDate, dayName: dateChange.targetDayName }
          : slot,
      )
      .sort((left, right) => {
        const dateCompare = left.dateStr.localeCompare(right.dateStr);
        return dateCompare !== 0 ? dateCompare : left.startTime.localeCompare(right.startTime);
      });

    params.setSavedLessonDistribution(updatedDistribution);
    const targetDateLabel = formatPlannerDisplayDate(dateChange.targetDate, dateChange.targetDayName);
    const movedCount = sessionsToMove.length;
    const totalLessons = sessionsToMove.reduce((sum, s) => sum + (s.lessons?.length ?? 0), 0);
    const assistantMessage = `He movido ${movedCount} sesion${movedCount > 1 ? 'es' : ''} (${totalLessons} lecciones) del ${dateChange.sourceDayName} al ${targetDateLabel}. Los horarios se mantienen igual.\n\n¿Te parece bien o quieres hacer algún otro cambio?`;

    params.setConversationHistory(prev => [
      ...prev,
      { role: 'user', content: rawMessage },
      { role: 'assistant', content: assistantMessage },
    ]);

    if (params.isAudioEnabled) {
      await params.speakText(`He movido ${movedCount} sesiones al ${targetDateLabel}.`);
    }
    return true;
  }, [
    params.conversationHistory, params.isAudioEnabled, params.savedLessonDistribution,
    params.setConversationHistory, params.setSavedLessonDistribution, params.speakText,
  ]);

  return { handleTimeChange, handleDateChange };
}
