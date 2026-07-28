'use client'

import type { LearnPageLogicResult } from '@/features/courses/hooks/useLearnPageLogic'

export function CourseLearnLoadingState({ logic }: { logic: LearnPageLogicResult }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900">
      <div className="text-center">
        <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-accent/20 border-t-accent" />
        <p className="text-lg text-primary dark:text-white" style={{ fontFamily: 'var(--font-system-ui)', fontWeight: 400 }}>
          {logic.mounted && logic.ready ? logic.t('loading.general') : 'Cargando...'}
        </p>
      </div>
    </div>
  )
}
