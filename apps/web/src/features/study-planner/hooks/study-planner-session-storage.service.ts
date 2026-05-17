import type { StudyPlannerSavedSession } from './useStudyPlannerSessionStorage.types';

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

function hasBrowserStorage() {
  return typeof window !== 'undefined';
}

function buildStorageKey(userId: string) {
  return `lia_planner_session_v1_${userId}`;
}

export function readPlannerSession(userId: string | null) {
  if (!userId || !hasBrowserStorage()) {
    return null;
  }

  try {
    const savedData = localStorage.getItem(buildStorageKey(userId));
    return savedData ? (JSON.parse(savedData) as StudyPlannerSavedSession) : null;
  } catch (error) {
    console.error('Error leyendo sesion guardada:', error);
    return null;
  }
}

export function savePlannerSession(
  userId: string,
  sessionData: StudyPlannerSavedSession,
) {
  if (!hasBrowserStorage()) {
    return;
  }

  localStorage.setItem(buildStorageKey(userId), JSON.stringify(sessionData));
}

export function removePlannerSession(userId: string | null) {
  if (userId && hasBrowserStorage()) {
    localStorage.removeItem(buildStorageKey(userId));
  }
}

export function hasRestorablePlannerSession(session: StudyPlannerSavedSession) {
  const sessionTime = new Date(session.timestamp).getTime();
  const isRecent = Date.now() - sessionTime < SESSION_TTL_MS;
  return Boolean(
    isRecent &&
    (session.conversationHistory?.length || session.savedLessonDistribution?.length),
  );
}

export function getSavedSessionDateLabel(session: StudyPlannerSavedSession) {
  return new Date(session.timestamp).toLocaleString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
