import type { Dispatch, SetStateAction } from 'react';
import type {
  StudyPlannerCalendarProvider,
  StudyPlannerMessage,
  StudyPlannerStoredLessonDistribution,
} from '../types/planner-ui.types';
import type { StudyPlannerCalendarDataMap } from '../types/planner-schedule.types';

export interface PlannerSessionTimeUpdate {
  dateStr: string;
  originalStartTime: string;
  newStartTime: string;
  newEndTime: string;
}

export function formatPlannerDisplayDate(dateStr: string, dayName: string): string {
  const [yearRaw, monthRaw, dayRaw] = dateStr.split('-');
  const year = Number.parseInt(yearRaw, 10);
  const month = Number.parseInt(monthRaw, 10) - 1;
  const day = Number.parseInt(dayRaw, 10);

  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return `${dayName} ${dateStr}`;
  }

  const monthNames = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];
  const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
  return `${capitalizedDay} ${day} de ${monthNames[month] ?? monthRaw} de ${year}`;
}

export function getChangedSessionUpdates(
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

export async function getActivePlanId(savedPlanId: string | null): Promise<string | null> {
  if (savedPlanId) return savedPlanId;
  try {
    const response = await fetch('/api/study-planner/active-plan');
    if (!response.ok) return null;
    const payload = (await response.json()) as { planId?: string | null };
    return payload.planId ?? null;
  } catch (error) {
    console.warn('No se pudo obtener el plan activo para sincronizar sesiones:', error);
    return null;
  }
}

export async function syncUpdatedStudyPlanSessions(params: {
  connectedCalendar: StudyPlannerCalendarProvider;
  savedPlanId: string | null;
  setConversationHistory: Dispatch<SetStateAction<StudyPlannerMessage[]>>;
  setSavedPlanId: Dispatch<SetStateAction<string | null>>;
  updates: PlannerSessionTimeUpdate[];
}): Promise<string | null> {
  const planIdToUse = await getActivePlanId(params.savedPlanId);
  if (!planIdToUse) return null;
  if (!params.savedPlanId) params.setSavedPlanId(planIdToUse);
  if (params.updates.length === 0) return planIdToUse;

  try {
    const updateResponse = await fetch('/api/study-planner/sessions/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId: planIdToUse, updates: params.updates }),
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error(`Error actualizando sesiones en BD (${updateResponse.status}):`, errorText);
      params.setConversationHistory(prev => [
        ...prev,
        { role: 'assistant', content: 'Error al actualizar los horarios en la base de datos. Por favor, intenta guardar el plan de nuevo.' },
      ]);
      return planIdToUse;
    }

    const updateData = await updateResponse.json() as {
      success?: boolean;
      data?: { updatedCount?: number; totalUpdates?: number; errors?: unknown[] };
    };

    if (!updateData.success) {
      params.setConversationHistory(prev => [
        ...prev,
        { role: 'assistant', content: 'No se pudieron actualizar los horarios en la base de datos. Por favor, intenta guardar el plan de nuevo.' },
      ]);
      return planIdToUse;
    }

    if ((updateData.data?.errors?.length ?? 0) > 0) {
      const updatedCount = updateData.data?.updatedCount ?? 0;
      const totalUpdates = updateData.data?.totalUpdates ?? params.updates.length;
      params.setConversationHistory(prev => [
        ...prev,
        { role: 'assistant', content: `Se actualizaron ${updatedCount} de ${totalUpdates} horarios. Algunos no se pudieron actualizar.` },
      ]);
    }

    if (params.connectedCalendar) {
      params.setConversationHistory(prev => [
        ...prev,
        { role: 'assistant', content: 'Los horarios se han actualizado en tu plan. Si tienes eventos en el calendario, es posible que necesites actualizarlos manualmente o re-sincronizar.' },
      ]);
    }

    return planIdToUse;
  } catch (error) {
    console.error('Error actualizando sesiones en BD:', error);
    return planIdToUse;
  }
}
