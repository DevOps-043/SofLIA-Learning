'use client'

import type { LearnPageLogicResult } from '@/features/courses/hooks/useLearnPageLogic'

export function LessonLoadingState({ logic }: { logic: LearnPageLogicResult }) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-primary/30 border-t-primary dark:border-primary/50 dark:border-t-primary" />
        <p className="text-[#6C757D] dark:text-white/60" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>{logic.t('loading.lesson')}</p>
      </div>
    </div>
  )
}
