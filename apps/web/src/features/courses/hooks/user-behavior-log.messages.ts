import type { BehaviorLogEntry } from "./user-behavior-log.utils";

export function buildAttemptedLessonChangeMessage(entries: BehaviorLogEntry[]) {
  const attempts = entries.filter((entry) => entry.action === "attempted_lesson_change_without_completion");
  if (attempts.length === 0) return "";

  const latestAttempt = attempts[attempts.length - 1];
  const pendingActivities =
    typeof latestAttempt.metadata?.pendingActivities === "string"
      ? latestAttempt.metadata.pendingActivities
      : "desconocidas";

  return `El usuario ha intentado ${attempts.length} veces cambiar a otra leccion sin completar las actividades requeridas. Actividades pendientes: ${pendingActivities}.`;
}

export function buildBlockedLessonsMessage(entries: BehaviorLogEntry[]) {
  const blockedAttempts = entries.filter((entry) => entry.action === "attempted_locked_lesson");
  return blockedAttempts.length > 0
    ? `Ha intentado ${blockedAttempts.length} veces acceder a lecciones bloqueadas.`
    : "";
}

export function buildMaterialsExplorationMessage(entries: BehaviorLogEntry[]) {
  const expandCollapseActions = entries.filter(
    (entry) => entry.action === "expand_lesson_materials" || entry.action === "collapse_lesson_materials"
  );
  return expandCollapseActions.length > 3
    ? `Esta explorando los materiales de forma repetitiva (${expandCollapseActions.length} veces en 5 min).`
    : "";
}

export function buildTabChangesMessage(entries: BehaviorLogEntry[]) {
  const tabChanges = entries.filter((entry) => entry.action === "tab_change");
  if (tabChanges.length <= 5) return "";

  const tabs = tabChanges
    .map((entry) => (typeof entry.metadata?.tab === "string" ? entry.metadata.tab : null))
    .filter((tab): tab is string => Boolean(tab));

  return `Ha cambiado de seccion ${tabChanges.length} veces (${tabs.join(" -> ")}), parece estar buscando algo especifico.`;
}

export function buildInactivityMessage(entries: BehaviorLogEntry[], now: number) {
  if (entries.length === 0) return "";

  const lastAction = entries[entries.length - 1];
  const timeSinceLastAction = (now - lastAction.timestamp) / 1000;
  return timeSinceLastAction > 120
    ? `Lleva ${Math.floor(timeSinceLastAction / 60)} minutos en la misma accion sin interactuar.`
    : "";
}

export function buildFailedAttemptsMessage(entries: BehaviorLogEntry[]) {
  const failedAttempts = entries.filter((entry) => entry.action === "activity_failed_attempt");
  return failedAttempts.length > 0
    ? `Ha fallado ${failedAttempts.length} intentos en actividades.`
    : "";
}
