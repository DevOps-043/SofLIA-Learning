import type { SofliaJoyrideStep as Step } from '@/features/tours/types/joyride'
import * as businessUserJoyrideConfig from '../../config/business-user-joyride-steps'
import {
  closeUserMenuIfOpen,
  ensureLearningPathsVisible,
  ensureUserMenuOpen,
} from './target-utils'

function getStepBehavior(step: Step | undefined): string | null {
  const data = step?.data
  if (typeof data !== 'object' || data === null || !('behavior' in data)) return null
  const behavior = (data as { behavior?: unknown }).behavior
  return typeof behavior === 'string' ? behavior : null
}

export function prepareBusinessUserStep(step: Step | undefined, isMobile: boolean): number {
  const behavior = getStepBehavior(step)
  if (behavior === businessUserJoyrideConfig.BUSINESS_USER_TOUR_STEP_BEHAVIOR.openUserMenu) {
    return ensureUserMenuOpen(isMobile)
  }
  const closeMenuDelay = closeUserMenuIfOpen()
  if (behavior === businessUserJoyrideConfig.BUSINESS_USER_TOUR_STEP_BEHAVIOR.showLearningPaths) {
    return Math.max(closeMenuDelay, ensureLearningPathsVisible())
  }
  return closeMenuDelay
}

export function resolveBusinessUserJoyrideSteps(
  isMobile: boolean,
  hasCourseControls: boolean,
  hasLearningPaths: boolean,
  t: businessUserJoyrideConfig.BusinessUserJoyrideTranslator
): Step[] {
  if (typeof businessUserJoyrideConfig.buildBusinessUserJoyrideSteps === 'function') {
    return businessUserJoyrideConfig.buildBusinessUserJoyrideSteps({
      hasCourseControls,
      hasLearningPaths,
      isMobile,
      t,
    })
  }
  if (Array.isArray(businessUserJoyrideConfig.businessUserJoyrideSteps)) {
    return businessUserJoyrideConfig.businessUserJoyrideSteps
  }
  return []
}
