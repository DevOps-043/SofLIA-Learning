import type { LessonCompletionDetails, LearnTranslate } from "./types";

export function buildCompletionDetailsText(
  details: Partial<LessonCompletionDetails> | undefined,
  t: LearnTranslate
): string | undefined {
  if (
    typeof details?.passed !== "number" ||
    typeof details.totalRequired !== "number"
  ) {
    return undefined;
  }

  return t("activities.completedCount", {
    passed: details.passed,
    total: details.totalRequired,
    defaultValue: `Completados: ${details.passed} de ${details.totalRequired}`,
  });
}
