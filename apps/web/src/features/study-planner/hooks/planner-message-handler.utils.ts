import type { Dispatch, SetStateAction } from 'react';
import type {
  StudyPlannerCalendarProvider,
  StudyPlannerMessage,
} from '../types/planner-ui.types';
import type {
  StudyPlannerCalendarDataMap,
  StudyPlannerStoredLessonDistribution,
} from '../types/planner-schedule.types';

export interface PlannerSessionTimeUpdate {
  sessionId?: string;
  clientReferenceId?: string;
  dateStr: string;
  originalStartTime: string;
  newStartTime: string;
  newEndTime: string;
}

export interface PlannerPatchResult {
  success: boolean;
  planId: string | null;
  updatedSessions: Array<{
    id: string;
    clientReferenceId?: string;
    title?: string;
    startTime: string;
    endTime: string;
  }>;
  errors: string[];
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
  const originalByClientReferenceId = new Map(
    savedLessonDistribution.map((slot) => [slot.clientReferenceId, slot]),
  );
  const originalBySessionId = new Map(
    savedLessonDistribution
      .filter((slot) => slot.sessionId)
      .map((slot) => [slot.sessionId as string, slot]),
  );

  return updatedDistribution
    .map((slot, index) => {
      const original =
        originalByClientReferenceId.get(slot.clientReferenceId)
        || (slot.sessionId ? originalBySessionId.get(slot.sessionId) : undefined)
        || savedLessonDistribution[index];
      if (
        !original
        || !original.startTime
        || !slot.startTime
        || !slot.endTime
        || (
          slot.dateStr === original.dateStr
          && slot.startTime === original.startTime
          && slot.endTime === original.endTime
        )
      ) {
        return null;
      }
      return {
        sessionId: original.sessionId,
        clientReferenceId: original.clientReferenceId,
        dateStr: slot.dateStr,
        originalStartTime: original.startTime,
        newStartTime: slot.startTime,
        newEndTime: slot.endTime,
      };
    })
    .filter((update): update is PlannerSessionTimeUpdate => update !== null);
}

export async function getActivePlanId(savedPlanId: string | null): Promise<string | null> {
  return savedPlanId;
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

export async function applyStudyPlanPatch(params: {
  savedPlanId: string | null;
  setSavedPlanId: Dispatch<SetStateAction<string | null>>;
  operations: Array<Record<string, unknown>>;
}): Promise<PlannerPatchResult> {
  const planIdToUse = await getActivePlanId(params.savedPlanId);
  if (!planIdToUse) {
    return {
      success: false,
      planId: null,
      updatedSessions: [],
      errors: ['No se encontro un plan activo para actualizar'],
    };
  }

  if (!params.savedPlanId) {
    params.setSavedPlanId(planIdToUse);
  }

  if (params.operations.length === 0) {
    return {
      success: false,
      planId: planIdToUse,
      updatedSessions: [],
      errors: ['No hay operaciones para aplicar'],
    };
  }

  try {
    const response = await fetch('/api/study-planner/plan/apply-patch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: planIdToUse,
        operations: params.operations,
      }),
    });

    const data = await response.json() as {
      success?: boolean;
      error?: string;
      data?: {
        errors?: string[];
        updatedSessions?: Array<{
          id: string;
          clientReferenceId?: string;
          title?: string;
          startTime: string;
          endTime: string;
        }>;
      };
    };

    return {
      success: Boolean(response.ok && data.success),
      planId: planIdToUse,
      updatedSessions: data.data?.updatedSessions ?? [],
      errors: data.data?.errors ?? (data.error ? [data.error] : []),
    };
  } catch (error) {
    return {
      success: false,
      planId: planIdToUse,
      updatedSessions: [],
      errors: [
        error instanceof Error
          ? error.message
          : 'No se pudo aplicar el cambio al plan',
      ],
    };
  }
}
