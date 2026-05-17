'use client'

import type { LearnPageLogicResult } from '@/features/courses/hooks/useLearnPageLogic'

export function CourseLearnLoadingState({ logic }: { logic: LearnPageLogicResult }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-[#0F1419]">
      <div className="text-center">
        <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-[#00D4B3]/20 border-t-[#00D4B3]" />
        <p className="text-lg text-[#0A2540] dark:text-white" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
          {logic.mounted && logic.ready ? logic.t('loading.general') : 'Cargando...'}
        </p>
      </div>
    </div>
  )
}
