import type {
  LessonActivityRow,
  LessonMaterialRow,
  ResolvedCourseLesson,
} from './sidebar.types'

type TranslationContext = ResolvedCourseLesson['translationContext']

export function mergeTranslationContext(
  translationContext: TranslationContext,
  activities: LessonActivityRow[],
  materials: LessonMaterialRow[],
) {
  const missingPieces = [...translationContext.missingPieces]

  if (translationContext.usedFallback && activities.length === 0) {
    missingPieces.push('activities')
  }
  if (translationContext.usedFallback && materials.length === 0) {
    missingPieces.push('materials')
  }

  return {
    ...translationContext,
    usedFallback:
      translationContext.usedFallback ||
      missingPieces.length > translationContext.missingPieces.length,
    missingPieces: [...new Set(missingPieces)],
  }
}
