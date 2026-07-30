'use client'

import { PremiumLoadingScreen } from '@/core/components/PremiumLoadingScreen/PremiumLoadingScreen'
import type { LearnPageLogicResult } from '@/features/courses/hooks/useLearnPageLogic'

export function LessonLoadingState({ logic }: { logic: LearnPageLogicResult }) {
  return (
    <PremiumLoadingScreen
      contained
      description="Sincronizando el contenido de esta lección."
      label={logic.t('loading.lesson')}
    />
  )
}
