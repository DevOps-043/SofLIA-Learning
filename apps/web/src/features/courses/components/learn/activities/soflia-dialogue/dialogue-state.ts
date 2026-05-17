import type { DialogueState } from "@/features/courses/types/dialogue-runtime";
import type { DialogueSession } from "./dialogue.types";

export function getStateTone(state?: DialogueState) {
  if (state === "COMPLETE" || state === "SESSION_SUMMARY") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300";
  }

  if (state === "FAIL_OR_RETRY") {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300";
  }

  return "border-accent/30 bg-accent/10 text-primary dark:border-accent/20 dark:bg-accent/10 dark:text-accent";
}

export function isDialogueTerminal(session: DialogueSession | null, canRetry: boolean) {
  return session?.state === "COMPLETE" || session?.state === "SESSION_SUMMARY" || canRetry;
}

export function getDialogueMetrics(session: DialogueSession | null) {
  const totalCriteria = (session?.criteriaMet.length || 0) + (session?.criteriaMissing.length || 0);
  const criteriaProgress = totalCriteria > 0
    ? Math.round(((session?.criteriaMet.length || 0) / totalCriteria) * 100)
    : 0;

  return {
    criteriaProgress,
    scoreValue: Math.round(session?.score ?? session?.result?.score ?? 0),
    totalCriteria,
  };
}
