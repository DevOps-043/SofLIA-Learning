import { useMemo } from 'react'

import type {
  LearnLesson,
  LearnLessonTranslationContextMap,
  LearnTranslationContext,
} from '../../components/learn/types'

interface UseLearnPageTranslationFallbackParams {
  currentLesson: LearnLesson | null
  learnDataTranslationContext: LearnTranslationContext | null
  lessonTranslationContexts: LearnLessonTranslationContextMap
  selectedLang: string
}

export function useLearnPageTranslationFallback({
  currentLesson,
  learnDataTranslationContext,
  lessonTranslationContexts,
  selectedLang,
}: UseLearnPageTranslationFallbackParams) {
  return useMemo(() => {
    const context =
      (currentLesson
        ? lessonTranslationContexts[currentLesson.lesson_id]
        : null) || learnDataTranslationContext

    if (!context?.usedFallback) {
      return null
    }

    const details =
      context.missingPieces.length > 0
        ? context.missingPieces.join(', ')
        : 'lesson_text'

    if (selectedLang === 'en') {
      return {
        title: 'Some translations are missing',
        message:
          'This lesson is shown partially in its original language to avoid blocking your progress.',
        details,
      }
    }

    if (selectedLang === 'pt') {
      return {
        title: 'Faltam algumas traducoes',
        message:
          'Esta licao esta sendo exibida parcialmente no idioma original para evitar bloqueios.',
        details,
      }
    }

    return {
      title: 'Faltan algunas traducciones',
      message:
        'Esta leccion se muestra parcialmente en su idioma original para evitar bloqueos.',
      details,
    }
  }, [
    currentLesson,
    learnDataTranslationContext,
    lessonTranslationContexts,
    selectedLang,
  ])
}
