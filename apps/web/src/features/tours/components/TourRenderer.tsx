'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ACTIONS, EVENTS, Joyride, STATUS, type EventData, type Step } from 'react-joyride'
import { useTranslation } from 'react-i18next'

import { useThemeStore } from '@/core/stores/themeStore'

import { useTourStore } from '../tour.store'
import { translateTourKey } from '../utils/tour.i18n'
import { isMobileViewport, resolveStepPlacement, resolveSteps } from '../utils/tour.helpers'
import { TourTooltip } from './TourTooltip'

const TOUR_OVERLAY_Z_INDEX = 10000
const TOUR_FLOATER_Z_INDEX = TOUR_OVERLAY_Z_INDEX + 10

export function TourRenderer() {
  const { t, i18n } = useTranslation('tours')
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme)
  const activeTourConfig = useTourStore((state) => state.activeTourConfig)
  const currentStep = useTourStore((state) => state.currentStep)
  const isRunning = useTourStore((state) => state.isRunning)
  const nextStep = useTourStore((state) => state.nextStep)
  const prevStep = useTourStore((state) => state.prevStep)
  const goToStep = useTourStore((state) => state.goToStep)
  const stopTour = useTourStore((state) => state.stopTour)
  const markCompleted = useTourStore((state) => state.markCompleted)
  const [isMobile, setIsMobile] = useState(() => isMobileViewport())

  const completeActiveTour = useCallback(() => {
    if (!activeTourConfig) {
      return
    }

    markCompleted(activeTourConfig.id)
    stopTour()
  }, [activeTourConfig, markCompleted, stopTour])

  useEffect(() => {
    const updateViewport = () => setIsMobile(isMobileViewport())

    updateViewport()
    window.addEventListener('resize', updateViewport)

    return () => {
      window.removeEventListener('resize', updateViewport)
    }
  }, [])

  const resolvedTourSteps = useMemo(
    () => resolveSteps(activeTourConfig?.steps ?? []),
    [activeTourConfig?.steps],
  )

  const joyrideSteps = useMemo<Step[]>(
    () =>
      resolvedTourSteps.map((step) => ({
        target: step.target,
        title: translateTourKey(t, i18n, step.titleKey),
        content: translateTourKey(t, i18n, step.contentKey),
        placement: resolveStepPlacement(step, isMobile),
        skipBeacon: step.disableBeacon ?? true,
        blockTargetInteraction: step.spotlightClicks !== true,
      })),
    [i18n, i18n.language, i18n.resolvedLanguage, isMobile, resolvedTourSteps, t],
  )

  useEffect(() => {
    if (!isRunning || !activeTourConfig) {
      return
    }

    if (joyrideSteps.length === 0) {
      stopTour()
      return
    }

    if (currentStep > joyrideSteps.length - 1) {
      goToStep(joyrideSteps.length - 1)
    }
  }, [activeTourConfig, currentStep, goToStep, isRunning, joyrideSteps.length, stopTour])

  const handleJoyrideEvent = useCallback(
    (data: EventData) => {
      if (!activeTourConfig) {
        return
      }

      if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
        completeActiveTour()
        return
      }

      if (data.type === EVENTS.TARGET_NOT_FOUND) {
        if (data.action === ACTIONS.PREV) {
          prevStep()
          return
        }

        if (data.index >= data.size - 1) {
          completeActiveTour()
          return
        }

        nextStep()
        return
      }

      if (data.type !== EVENTS.STEP_AFTER) {
        return
      }

      if (data.action === ACTIONS.NEXT) {
        if (data.index >= data.size - 1) {
          completeActiveTour()
          return
        }

        nextStep()
        return
      }

      if (data.action === ACTIONS.PREV) {
        prevStep()
      }
    },
    [activeTourConfig, completeActiveTour, nextStep, prevStep],
  )

  if (!isRunning || !activeTourConfig) {
    return null
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <Joyride
      run={isRunning}
      steps={joyrideSteps}
      stepIndex={currentStep}
      continuous
      scrollToFirstStep
      tooltipComponent={TourTooltip}
      onEvent={handleJoyrideEvent}
      locale={{
        back: translateTourKey(t, i18n, 'actions.back'),
        close: translateTourKey(t, i18n, 'actions.skip'),
        last: translateTourKey(t, i18n, 'actions.finish'),
        next: translateTourKey(t, i18n, 'actions.next'),
        skip: translateTourKey(t, i18n, 'actions.skip'),
      }}
      options={{
        arrowColor: isDark ? 'var(--color-gray-800)' : 'var(--color-bg-light)',
        backgroundColor: isDark ? 'var(--color-gray-800)' : 'var(--color-bg-light)',
        blockTargetInteraction: true,
        closeButtonAction: 'skip',
        offset: 12,
        overlayClickAction: false,
        overlayColor: isDark
          ? isMobile
            ? 'rgba(0,0,0,0.62)'
            : 'rgba(0,0,0,0.72)'
          : isMobile
            ? 'rgba(0,0,0,0.55)'
            : 'rgba(0,0,0,0.65)',
        primaryColor: 'var(--color-accent)',
        scrollOffset: 120,
        showProgress: false,
        spotlightPadding: 8,
        spotlightRadius: 10,
        zIndex: TOUR_OVERLAY_Z_INDEX,
      }}
      floatingOptions={{
        flipOptions: {
          fallbackPlacements: ['right', 'left', 'bottom', 'top'],
          padding: 24,
        },
        shiftOptions: {
          padding: 24,
        },
        strategy: 'fixed',
      }}
      styles={{
        beaconInner: {
          backgroundColor: 'var(--color-accent)',
        },
        beaconOuter: {
          backgroundColor: 'rgb(var(--color-accent-rgb) / 0.2)',
          border: '2px solid var(--color-accent)',
        },
        floater: {
          filter: 'none',
          pointerEvents: 'auto',
          zIndex: TOUR_FLOATER_Z_INDEX,
        },
        overlay: {
          zIndex: TOUR_OVERLAY_Z_INDEX,
        },
        spotlight: {
          stroke: 'var(--color-accent)',
          strokeWidth: 3,
        },
        tooltip: {
          backgroundColor: 'transparent',
          padding: 0,
          width: 'auto',
        },
      }}
    />
  )
}
