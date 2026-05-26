'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ACTIONS, EVENTS, Joyride, STATUS, type EventData, type Step } from 'react-joyride'
import { useTranslation } from 'react-i18next'

import { useThemeStore } from '@/core/stores/themeStore'

import { useTourStore } from '../tour.store'
import { isMobileViewport, resolveStepPlacement, resolveSteps } from '../utils/tour.helpers'
import { TourTooltip } from './TourTooltip'

const TOURS_NAMESPACE_PREFIX = 'tours.'

function resolveTranslationKey(key: string): string {
  return key.startsWith(TOURS_NAMESPACE_PREFIX) ? key.slice(TOURS_NAMESPACE_PREFIX.length) : key
}

export function TourRenderer() {
  const { t } = useTranslation('tours')
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
        title: t(resolveTranslationKey(step.titleKey)),
        content: t(resolveTranslationKey(step.contentKey)),
        placement: resolveStepPlacement(step, isMobile),
        skipBeacon: step.disableBeacon ?? true,
        blockTargetInteraction: step.spotlightClicks !== true,
      })),
    [isMobile, resolvedTourSteps, t],
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

      if (data.status === STATUS.FINISHED) {
        markCompleted(activeTourConfig.id)
        stopTour()
        return
      }

      if (data.status === STATUS.SKIPPED) {
        markCompleted(activeTourConfig.id)
        stopTour()
        return
      }

      if (data.type === EVENTS.TARGET_NOT_FOUND) {
        if (data.action === ACTIONS.PREV) {
          prevStep()
          return
        }

        if (data.index >= data.size - 1) {
          markCompleted(activeTourConfig.id)
          stopTour()
          return
        }

        nextStep()
        return
      }

      if (data.type !== EVENTS.STEP_AFTER) {
        return
      }

      if (data.action === ACTIONS.NEXT) {
        nextStep()
        return
      }

      if (data.action === ACTIONS.PREV) {
        prevStep()
      }
    },
    [activeTourConfig, markCompleted, nextStep, prevStep, stopTour],
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
        back: t('actions.back'),
        close: t('actions.skip'),
        last: t('actions.finish'),
        next: t('actions.next'),
        skip: t('actions.skip'),
      }}
      options={{
        arrowColor: isDark ? 'var(--color-gray-800)' : 'var(--color-bg-light)',
        backgroundColor: isDark ? 'var(--color-gray-800)' : 'var(--color-bg-light)',
        blockTargetInteraction: true,
        closeButtonAction: 'skip',
        offset: 12,
        overlayClickAction: false,
        overlayColor: isMobile ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.55)',
        primaryColor: 'var(--color-accent)',
        scrollOffset: 120,
        showProgress: false,
        spotlightRadius: 10,
        zIndex: 10000,
      }}
      floatingOptions={{
        shiftOptions: {
          padding: 16,
        },
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
