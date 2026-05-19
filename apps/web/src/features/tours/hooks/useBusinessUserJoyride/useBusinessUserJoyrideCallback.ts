import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useCallback } from 'react'
import { ACTIONS, EVENTS, STATUS } from 'react-joyride'
import { closeUserMenuIfOpen } from './target-utils'
import type { SofliaJoyrideEvent as CallBackProps, SofliaJoyrideStep as Step } from '../../types/joyride'

interface UseBusinessUserJoyrideCallbackParams {
  completeTour: () => Promise<void>
  moveToStep: (index: number) => void
  runnableSteps: Step[]
  setIsTourFinishedInSession: (isFinished: boolean) => void
  setRun: (run: boolean) => void
  skipTour: () => Promise<void>
  targetNotFoundRetryCount: React.MutableRefObject<number>
}

export function useBusinessUserJoyrideCallback({
  completeTour,
  moveToStep,
  runnableSteps,
  setIsTourFinishedInSession,
  setRun,
  skipTour,
  targetNotFoundRetryCount,
}: UseBusinessUserJoyrideCallbackParams) {
  const finishTour = useCallback((operation: () => Promise<void>, label: string) => {
    setRun(false)
    setIsTourFinishedInSession(true)
    closeUserMenuIfOpen()
    operation().catch((error) => techDebtLogger.error(`[useBusinessUserJoyride] ${label}`, error))
  }, [setIsTourFinishedInSession, setRun])

  return useCallback((data: CallBackProps) => {
    const { action, index, status, type } = data
    if (type === EVENTS.TARGET_NOT_FOUND) {
      targetNotFoundRetryCount.current += 1
      techDebtLogger.warn('[useBusinessUserJoyride] TARGET_NOT_FOUND on step', index, '— retry', targetNotFoundRetryCount.current)
      if (targetNotFoundRetryCount.current > 2) {
        targetNotFoundRetryCount.current = 0
        if (index >= runnableSteps.length - 1) {
          finishTour(completeTour, 'Complete failed (target not found)')
          return
        }
      }
    } else if (type === EVENTS.STEP_AFTER) {
      targetNotFoundRetryCount.current = 0
    }

    if (status === STATUS.FINISHED) {
      finishTour(completeTour, 'Complete failed')
      return
    }
    if (status === STATUS.SKIPPED || action === ACTIONS.SKIP || action === ACTIONS.CLOSE) {
      finishTour(skipTour, action === ACTIONS.CLOSE ? 'Close failed' : 'Skip failed')
      return
    }
    if (type !== EVENTS.STEP_AFTER && type !== EVENTS.TARGET_NOT_FOUND) return
    if (action === ACTIONS.PREV) {
      moveToStep(Math.max(0, index - 1))
      return
    }
    if (index >= runnableSteps.length - 1) {
      finishTour(completeTour, 'Complete failed (last step)')
      return
    }
    moveToStep(index + 1)
  }, [completeTour, finishTour, moveToStep, runnableSteps.length, skipTour, targetNotFoundRetryCount])
}
