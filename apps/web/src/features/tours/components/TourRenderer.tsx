'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ACTIONS, EVENTS, Joyride, STATUS, type EventData, type Step } from 'react-joyride'
import { useTranslation } from 'react-i18next'

import { useThemeStore } from '@/core/stores/themeStore'
import { OnboardingVideoPlayer } from '@/features/courses/components/onboarding-video-player/OnboardingVideoPlayer'

import { useTourStore } from '../tour.store'
import { translateTourKey } from '../utils/tour.i18n'
import {
  clampTourFloaterToViewport,
  isMobileViewport,
  resolveStepPlacement,
  resolveSteps,
} from '../utils/tour.helpers'
import { TourTooltip } from './TourTooltip'

const TOUR_OVERLAY_Z_INDEX = 10000
const TOUR_FLOATER_Z_INDEX = TOUR_OVERLAY_Z_INDEX + 10
const SHIFT_PADDING_DEFAULT = 24

function getSidebarShiftPad(): number {
  if (typeof document === 'undefined') return SHIFT_PADDING_DEFAULT
  const el = document.querySelector<HTMLElement>('#business-panel-sidebar-root')
  if (!el) return SHIFT_PADDING_DEFAULT
  const right = Math.round(el.getBoundingClientRect().right)
  return right > 0 ? right + SHIFT_PADDING_DEFAULT : SHIFT_PADDING_DEFAULT
}

export function TourRenderer() {
  const { t, i18n } = useTranslation('tours')
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme)
  const activeTourConfig = useTourStore((state) => state.activeTourConfig)
  const currentStep = useTourStore((state) => state.currentStep)
  const isRunning = useTourStore((state) => state.isRunning)
  const introVideoUrl = useTourStore((state) => state.introVideoUrl)
  const completeIntroVideo = useTourStore((state) => state.completeIntroVideo)
  const nextStep = useTourStore((state) => state.nextStep)
  const prevStep = useTourStore((state) => state.prevStep)
  const goToStep = useTourStore((state) => state.goToStep)
  const stopTour = useTourStore((state) => state.stopTour)
  const markCompleted = useTourStore((state) => state.markCompleted)
  const [isMobile, setIsMobile] = useState(() => isMobileViewport())
  const [sidebarShiftPad, setSidebarShiftPad] = useState(getSidebarShiftPad)

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

  // Track the business-panel sidebar width so floating-ui's shift middleware
  // keeps the tooltip fully inside the content area (never behind the sidebar).
  useEffect(() => {
    const sidebarEl = document.querySelector<HTMLElement>('#business-panel-sidebar-root')
    if (!sidebarEl) return

    const sync = () => setSidebarShiftPad(getSidebarShiftPad())
    const ro = new ResizeObserver(sync)
    ro.observe(sidebarEl)
    return () => ro.disconnect()
  }, [])

  const resolvedTourSteps = useMemo(
    () => resolveSteps(activeTourConfig?.steps ?? []),
    [activeTourConfig?.steps],
  )

  const joyrideSteps = useMemo<Step[]>(
    () =>
      resolvedTourSteps.map((step) => ({
        target: step.target,
        data: { tourTarget: step.target },
        title: translateTourKey(t, i18n, step.titleKey),
        content: translateTourKey(t, i18n, step.contentKey),
        placement: resolveStepPlacement(step, isMobile),
        skipBeacon: step.disableBeacon ?? true,
        blockTargetInteraction: step.spotlightClicks !== true,
        // Inject per-step so rootBoundary is guaranteed to be 'viewport'.
        // Without this, Joyride may use a scrollable ancestor as the shift
        // boundary, which lets the tooltip escape the visible viewport area.
        floatingOptions: {
          hideArrow: true,
          shiftOptions: {
            rootBoundary: 'viewport',
          },
        },
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

  useEffect(() => {
    if (!isRunning || joyrideSteps.length === 0) {
      return
    }

    const pad = isMobile ? 12 : 16
    // Guard prevents the MutationObserver from re-triggering when WE set translate.
    let clamping = false

    const clampTooltip = () => {
      if (clamping) return
      window.requestAnimationFrame(() => {
        clamping = true
        clampTourFloaterToViewport(pad)
        clamping = false
      })
    }

    const timers = [
      window.setTimeout(clampTooltip, 0),
      window.setTimeout(clampTooltip, 120),
      window.setTimeout(clampTooltip, 320),
      window.setTimeout(clampTooltip, 600),
    ]

    window.addEventListener('resize', clampTooltip)
    window.addEventListener('scroll', clampTooltip, true)

    // Watch for floating-ui autoUpdate repositions and re-clamp immediately.
    // Attaches once the floater element is in the DOM.
    let mutationObserver: MutationObserver | null = null
    const attachObserver = () => {
      if (mutationObserver) return
      const floater = document.querySelector<HTMLElement>('.react-joyride__floater')
      if (!floater) return
      mutationObserver = new MutationObserver((mutations) => {
        if (clamping) return
        for (const m of mutations) {
          if (m.attributeName === 'style') {
            clampTooltip()
            break
          }
        }
      })
      mutationObserver.observe(floater, { attributes: true, attributeFilter: ['style'] })
    }

    const observerTimers = [
      window.setTimeout(attachObserver, 0),
      window.setTimeout(attachObserver, 100),
      window.setTimeout(attachObserver, 300),
    ]

    return () => {
      timers.forEach((id) => window.clearTimeout(id))
      observerTimers.forEach((id) => window.clearTimeout(id))
      window.removeEventListener('resize', clampTooltip)
      window.removeEventListener('scroll', clampTooltip, true)
      mutationObserver?.disconnect()
    }
  }, [currentStep, isMobile, isRunning, joyrideSteps.length])

  const handleJoyrideEvent = useCallback(
    (data: EventData) => {
      if (!activeTourConfig) {
        return
      }

      if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
        completeActiveTour()
        return
      }

      // Pressing Escape (or any explicit close) fires ACTIONS.CLOSE. In
      // controlled mode Joyride only flips its internal lifecycle to COMPLETE
      // without changing `run`, so the tooltip vanishes but the dimming overlay
      // stays mounted and keeps the screen blocked. We must tear the tour down
      // ourselves to release the UI.
      if (data.action === ACTIONS.CLOSE) {
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

  // Video phase: play the platform onboarding video before the Joyride steps.
  if (activeTourConfig && introVideoUrl && !isRunning) {
    return (
      <OnboardingVideoPlayer
        videos={[introVideoUrl]}
        onComplete={completeIntroVideo}
        skipOnError
      />
    )
  }

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
        backgroundColor: 'var(--color-surface)',
        blockTargetInteraction: true,
        closeButtonAction: 'skip',
        offset: 16,
        overlayClickAction: false,
        overlayColor: isDark
          ? isMobile
            ? 'rgba(2, 12, 23, 0.66)'
            : 'rgba(2, 12, 23, 0.74)'
          : isMobile
            ? 'rgba(2, 12, 23, 0.58)'
            : 'rgba(2, 12, 23, 0.66)',
        primaryColor: 'var(--color-accent)',
        scrollOffset: 120,
        showProgress: false,
        spotlightPadding: 10,
        spotlightRadius: 16,
        zIndex: TOUR_OVERLAY_Z_INDEX,
      }}
      floatingOptions={{
        flipOptions: {
          fallbackPlacements: ['bottom', 'right', 'left', 'top'],
          padding: 24,
        },
        hideArrow: true,
        shiftOptions: {
          // Per-side padding so floating-ui shifts the tooltip
          // to stay inside the content area, not behind any left sidebar.
          padding: {
            top: 24,
            right: 24,
            bottom: 24,
            left: sidebarShiftPad,
          },
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
          backdropFilter: 'none',
          filter: 'none',
          WebkitBackdropFilter: 'none',
          zIndex: TOUR_OVERLAY_Z_INDEX,
        },
        spotlight: {
          stroke: 'var(--color-accent)',
          strokeWidth: 2,
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
