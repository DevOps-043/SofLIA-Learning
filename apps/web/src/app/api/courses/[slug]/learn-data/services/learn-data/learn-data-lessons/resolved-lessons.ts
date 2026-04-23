import {
  resolveLessonContentWithFallback,
  type TranslationContext,
} from '../../../../../_services/lesson-language-resolution.service'
import type { LessonRow } from './types'

export function resolveLessonsForLanguage(
  requestedLanguage: string,
  baseLessons: LessonRow[],
  translatedLessonsById: Map<string, LessonRow>,
) {
  const moduleTranslationContexts: TranslationContext[] = []
  const lessons = baseLessons.map((baseLesson) => {
    const resolved = resolveLessonContentWithFallback({
      requestedLanguage,
      baseLesson,
      translatedLesson:
        requestedLanguage === 'es'
          ? null
          : translatedLessonsById.get(baseLesson.lesson_id) || null,
    })

    if (resolved.translationContext.usedFallback) {
      moduleTranslationContexts.push(resolved.translationContext)
    }

    return resolved.lesson as LessonRow
  })

  return { lessons, moduleTranslationContexts }
}
