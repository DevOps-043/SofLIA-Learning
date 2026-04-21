export type {
  BuildStudyPlanPayloadParams,
  SaveStudyPlanApiData,
  StudyPlanConfigPayload,
  StudyPlanPreferredTimeBlock,
  StudyPlanSavePayload,
  StudyPlanSessionLessonPayload,
  StudyPlanSessionPayload,
  StudyPlannerSessionType,
  SyncStudyPlanSessionsResult,
} from './study-plan-persistence.types';

export { buildStudyPlanPayload, getPureCourseId } from './study-plan-payload-builder';
export {
  cleanupPreviousPlanEvents,
  DuplicatePlanError,
  saveStudyPlanRequest,
  syncStudyPlanSessions,
} from './study-plan-api.service';

import type { SaveStudyPlanApiData } from './study-plan-persistence.types';
import type { StudyPlannerStoredLessonDistribution } from '../types/planner-schedule.types';

export function attachSessionIdsToDistribution(params: {
  savedLessonDistribution: StudyPlannerStoredLessonDistribution[];
  savedSessions?: SaveStudyPlanApiData['sessions'];
}): StudyPlannerStoredLessonDistribution[] {
  if (!params.savedSessions || params.savedSessions.length === 0) {
    return params.savedLessonDistribution;
  }

  const sessionsByClientReferenceId = new Map(
    params.savedSessions
      .filter((session) => session.clientReferenceId)
      .map((session) => [session.clientReferenceId as string, session.id]),
  );

  return params.savedLessonDistribution.map((distribution) => ({
    ...distribution,
    sessionId:
      sessionsByClientReferenceId.get(distribution.clientReferenceId) || distribution.sessionId,
  }));
}

export function buildStudyPlanSuccessMessage(params: {
  connectedCalendar: 'google' | 'microsoft' | null;
  insertedCount: number;
  sessionsCount: number;
  syncSuccess: boolean;
}): string {
  let calendarMessage = '';
  if (params.connectedCalendar && params.syncSuccess && params.insertedCount > 0) {
    calendarMessage = ` He insertado ${params.insertedCount} eventos en tu calendario de Google (en "SofLIA - Sesiones de Estudio").`;
  } else if (params.connectedCalendar) {
    calendarMessage = ' Las sesiones han sido sincronizadas con tu calendario.';
  }
  return `Perfecto! He guardado tu plan de estudios con ${params.sessionsCount} sesiones programadas.${calendarMessage}\n\nPuedes ver tu plan en la seccion de "Mis Planes" y comenzar a estudiar cuando lo desees.`;
}
