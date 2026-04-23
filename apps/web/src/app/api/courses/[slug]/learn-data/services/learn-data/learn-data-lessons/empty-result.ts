import type { ModulesWithProgressResult } from './types'

export function createEmptyModulesWithProgressResult(
  requestedLanguage: string,
): ModulesWithProgressResult {
  return {
    modules: [],
    progress: 0,
    lastWatchedLessonId: null,
    translationContext: {
      requestedLanguage,
      resolvedLanguage: requestedLanguage,
      usedFallback: false,
      missingPieces: [],
    },
    enrollmentId: null,
    organizationId: null,
  }
}
