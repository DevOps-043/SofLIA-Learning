import type { SaveStudyPlanApiData, StudyPlanSavePayload, SyncStudyPlanSessionsResult } from './study-plan-persistence.types';

export class DuplicatePlanError extends Error {
  readonly courseId?: string;

  constructor(message: string, courseId?: string) {
    super(message);
    this.name = 'DuplicatePlanError';
    this.courseId = courseId;
  }
}

export async function saveStudyPlanRequest(
  payload: StudyPlanSavePayload,
): Promise<SaveStudyPlanApiData> {
  const response = await fetch('/api/study-planner/save-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config: payload.planConfig, sessions: payload.sessions }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Error ${response.status}: ${response.statusText || 'Error desconocido'}`;
    try {
      const errorData = errorText ? (JSON.parse(errorText) as Record<string, unknown>) : {};
      const error =
        typeof errorData.error === 'string' && errorData.error.trim() !== ''
          ? errorData.error
          : typeof errorData.message === 'string' && errorData.message.trim() !== ''
            ? errorData.message
            : null;
      if (error) errorMessage = error;
    } catch {
      if (errorText.trim() !== '') errorMessage = `Error ${response.status}: ${errorText.slice(0, 200)}`;
    }
    if (response.status === 409) throw new DuplicatePlanError(errorMessage);
    throw new Error(errorMessage);
  }

  const responseData = (await response.json()) as {
    success?: boolean;
    error?: string;
    data?: SaveStudyPlanApiData & {
      sessions?: Array<{ id: string; clientReferenceId?: string; startTime?: string; endTime?: string }>;
    };
  };

  if (!responseData.success) {
    throw new Error(responseData.error || 'Error al guardar el plan');
  }

  return responseData.data || {};
}

export async function syncStudyPlanSessions(sessionIds: string[]): Promise<SyncStudyPlanSessionsResult> {
  if (sessionIds.length === 0) {
    return { success: false, insertedCount: 0, requiresReconnection: false };
  }

  const response = await fetch('/api/study-planner/calendar/sync-sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionIds }),
  });

  const result = (await response.json()) as {
    success?: boolean;
    error?: string;
    data?: { syncedCount?: number };
  };

  return {
    success: Boolean(response.ok && result.success),
    insertedCount: result.data?.syncedCount || 0,
    requiresReconnection: response.status === 401,
  };
}

export async function cleanupPreviousPlanEvents(planId: string): Promise<void> {
  await fetch('/api/study-planner/calendar/delete-plan-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planId }),
  });
}
