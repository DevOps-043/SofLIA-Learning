'use client'

import type { LearnPageLogicResult } from '@/features/courses/hooks/useLearnPageLogic'

export function TranslationWarning({ logic }: { logic: LearnPageLogicResult }) {
  if (!logic.translationFallbackWarning) return null
  return (
    <div className="mx-2 mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900 md:mx-4 dark:border-amber-700/60 dark:bg-amber-900/20 dark:text-amber-200">
      <p className="text-sm font-semibold">{logic.translationFallbackWarning.title}</p>
      <p className="text-xs">{logic.translationFallbackWarning.message}</p>
    </div>
  )
}
