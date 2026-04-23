import type {
  LessonCompletionContext,
} from './types'

// Side effects run fire-and-forget after the lesson progress is saved.
// Failures here must not block the response to the user.
export function triggerLessonProgressSideEffectsAsync(
  completionContext: LessonCompletionContext,
  overallProgress: number,
) {
  void import('../lesson-progress-side-effects.service')
    .then(({ triggerLessonProgressSideEffects }) => {
      triggerLessonProgressSideEffects(completionContext, overallProgress)
    })
    .catch((error) => {
      console.error('[LessonProgressSideEffects] Failed to run side effects', {
        lessonId: completionContext.lessonId,
        userId: completionContext.userId,
        error: error instanceof Error ? error.message : String(error),
      })
    })
}
