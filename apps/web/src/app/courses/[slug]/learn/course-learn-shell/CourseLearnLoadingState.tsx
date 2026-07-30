'use client'

import { PremiumLoadingScreen } from '@/core/components/PremiumLoadingScreen/PremiumLoadingScreen'
import type { LearnPageLogicResult } from '@/features/courses/hooks/useLearnPageLogic'

export function CourseLearnLoadingState({ logic }: { logic: LearnPageLogicResult }) {
  return (
    <PremiumLoadingScreen
      description="Preparando el contenido, tu progreso y las herramientas de la lección."
      label={logic.mounted && logic.ready ? logic.t('loading.general') : 'Cargando curso'}
    />
  )
}
