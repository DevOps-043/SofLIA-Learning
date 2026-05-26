'use client'

import { useCallback } from 'react'

import { useTourStore } from '../tour.store'
import type { TourConfig } from '../types'
import { resolveSteps, shouldAutoStartTour, TOUR_AUTOSTART_DELAY_MS } from '../utils/tour.helpers'

export function useTour(config: TourConfig): {
  startTour: () => void
  restartTour: () => void
  stopTour: () => void
  isRunning: boolean
  currentStep: number
  totalSteps: number
  hasCompleted: boolean
  autoStartIfNeeded: () => (() => void) | undefined
} {
  const startTourAction = useTourStore((state) => state.startTour)
  const stopTourAction = useTourStore((state) => state.stopTour)
  const resetTourAction = useTourStore((state) => state.resetTour)
  const isRunning = useTourStore((state) => state.isRunning)
  const currentStep = useTourStore((state) => state.currentStep)
  const hasCompleted = useTourStore((state) => state.completedTours.includes(config.id))

  const startTour = useCallback(() => {
    const resolvedSteps = resolveSteps(config.steps)

    startTourAction({
      ...config,
      steps: resolvedSteps,
    })
  }, [config, startTourAction])

  const restartTour = useCallback(() => {
    stopTourAction()
    resetTourAction(config.id)
    startTour()
  }, [config.id, resetTourAction, startTour, stopTourAction])

  const autoStartIfNeeded = useCallback(() => {
    if (!config.autoStart || hasCompleted || isRunning || !shouldAutoStartTour()) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      const tourState = useTourStore.getState()

      if (
        tourState.isRunning ||
        tourState.completedTours.includes(config.id) ||
        !shouldAutoStartTour()
      ) {
        return
      }

      startTour()
    }, TOUR_AUTOSTART_DELAY_MS)

    return () => window.clearTimeout(timeoutId)
  }, [config.autoStart, config.id, hasCompleted, isRunning, startTour])

  return {
    startTour,
    restartTour,
    stopTour: stopTourAction,
    isRunning,
    currentStep,
    totalSteps: config.steps.length,
    hasCompleted,
    autoStartIfNeeded,
  }
}
