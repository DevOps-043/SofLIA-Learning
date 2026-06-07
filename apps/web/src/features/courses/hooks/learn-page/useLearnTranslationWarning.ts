'use client'

import { useMemo } from 'react'

import type {
  LearnLesson,
  LearnTranslationContext,
} from '../../components/learn/types'

type Locale = 'es' | 'en' | 'pt'

interface UseLearnTranslationWarningOptions {
  currentLesson: LearnLesson | null
  lessonTranslationContexts: Record<string, LearnTranslationContext | null>
  learnDataTranslationContext: LearnTranslationContext | null
  selectedLang: Locale
}

interface TranslationFallbackWarning {
  title: string
  message: string
  details: string
}

const COPY: Record<Locale, Omit<TranslationFallbackWarning, 'details'>> = {
  en: {
    title: 'Some translations are missing',
    message:
      'This lesson is shown partially in its original language to avoid blocking your progress.',
  },
  pt: {
    title: 'Faltam algumas traducoes',
    message:
      'Esta licao esta sendo exibida parcialmente no idioma original para evitar bloqueios.',
  },
  es: {
    title: 'Faltan algunas traducciones',
    message:
      'Esta leccion se muestra parcialmente en su idioma original para evitar bloqueos.',
  },
}

/**
 * Computes the i18n fallback warning shown to learners when a lesson
 * has missing translations.  Picks the per-lesson context first and
 * falls back to the course-level context, then localises the copy
 * to the user's selected language.
 */
export function useLearnTranslationWarning({
  currentLesson,
  lessonTranslationContexts,
  learnDataTranslationContext,
  selectedLang,
}: UseLearnTranslationWarningOptions): TranslationFallbackWarning | null {
  return useMemo(() => {
    const context =
      (currentLesson ? lessonTranslationContexts[currentLesson.lesson_id] : null) ||
      learnDataTranslationContext

    if (!context?.usedFallback) return null

    const details =
      context.missingPieces.length > 0 ? context.missingPieces.join(', ') : 'lesson_text'

    return { ...COPY[selectedLang], details }
  }, [currentLesson, learnDataTranslationContext, lessonTranslationContexts, selectedLang])
}
