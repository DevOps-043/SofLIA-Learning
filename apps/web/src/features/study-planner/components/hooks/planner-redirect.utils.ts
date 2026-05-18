'use client'

import { logger as techDebtLogger } from '@/lib/utils/logger'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

export type AnalyzeCalendarAndSuggest = (
  provider: string,
  targetDateParam?: string,
  approachParam?: import('../../types/planner-ui.types').StudyApproach | null,
  skipB2BRedirect?: boolean
) => Promise<void>

export function createPlannerRedirectScheduler(router: AppRouterInstance) {
  let redirectTimer: NodeJS.Timeout | null = null

  return function scheduleStudyPlannerRedirect(delayMs: number) {
    if (redirectTimer) {
      clearTimeout(redirectTimer)
      redirectTimer = null
    }

    redirectTimer = setTimeout(() => {
      redirectTimer = null
      try {
        if (router && typeof router.replace === 'function') {
          router.replace('/study-planner/dashboard')
        } else if (typeof window !== 'undefined') {
          window.location.href = '/study-planner/dashboard'
        }
      } catch (redirectError) {
        techDebtLogger.error('Error al redirigir:', redirectError)
        if (typeof window !== 'undefined') {
          window.location.href = '/study-planner/dashboard'
        }
      }
    }, delayMs)
  }
}
