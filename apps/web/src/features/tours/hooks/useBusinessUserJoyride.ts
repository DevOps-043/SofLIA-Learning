'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useTourRestart } from '../../../core/contexts/TourRestartContext'
import * as businessUserJoyrideConfig from '../config/business-user-joyride-steps'
import { buildBusinessUserJoyrideProps } from './useBusinessUserJoyride/joyride-props'
import { prepareBusinessUserStep, resolveBusinessUserJoyrideSteps } from './useBusinessUserJoyride/steps'
import { closeUserMenuIfOpen } from './useBusinessUserJoyride/target-utils'
import type { UseBusinessUserJoyrideOptions } from './useBusinessUserJoyride/types'
import { useBusinessUserJoyrideCallback } from './useBusinessUserJoyride/useBusinessUserJoyrideCallback'
import { useTourProgress } from './useTourProgress'

export function useBusinessUserJoyride(options: UseBusinessUserJoyrideOptions = {}) {
  const { enabled = true, hasCourseControls = true, hasLearningPaths = true } = options
  const { setRestart } = useTourRestart()
  const { t } = useTranslation('common')
  const { t: tBusiness } = useTranslation('business')
  const tourProgress = useTourProgress(businessUserJoyrideConfig.DASHBOARD_TOUR_ID)
  const [run, setRun] = useState(false)
  const [showVideoIntro, setShowVideoIntro] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [isTourFinishedInSession, setIsTourFinishedInSession] = useState(false)
  const targetNotFoundRetryCount = useRef(0)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const steps = useMemo(
    () => resolveBusinessUserJoyrideSteps(isMobile, hasCourseControls, hasLearningPaths, tBusiness),
    [hasCourseControls, hasLearningPaths, isMobile, tBusiness],
  )
  const runnableSteps = useMemo(() => steps, [steps])
  const moveToStep = useCallback((nextIndex: number) => {
    const delay = prepareBusinessUserStep(steps[nextIndex], isMobile)
    if (delay > 0) window.setTimeout(() => setStepIndex(nextIndex), delay)
    else setStepIndex(nextIndex)
  }, [isMobile, steps])

  useEffect(() => {
    if (!enabled || tourProgress.isLoading || !tourProgress.shouldShowTour || isTourFinishedInSession || run || showVideoIntro) return
    const timer = window.setTimeout(() => setShowVideoIntro(true), 2000)
    return () => window.clearTimeout(timer)
  }, [enabled, isTourFinishedInSession, run, showVideoIntro, tourProgress.isLoading, tourProgress.shouldShowTour])

  const handleVideoComplete = useCallback(() => {
    setShowVideoIntro(false)
    setStepIndex(0)
    setTimeout(() => {
      tourProgress.startTour().catch((error) => console.error('[useBusinessUserJoyride] DB start failed', error))
      prepareBusinessUserStep(steps[0], isMobile)
      setRun(true)
    }, 700)
  }, [isMobile, steps, tourProgress])

  const handleJoyrideCallback = useBusinessUserJoyrideCallback({
    completeTour: tourProgress.completeTour,
    moveToStep,
    runnableSteps,
    setIsTourFinishedInSession,
    setRun,
    skipTour: tourProgress.skipTour,
    targetNotFoundRetryCount,
  })

  const resetTour = useCallback(() => {
    setRun(false); setStepIndex(0); closeUserMenuIfOpen()
  }, [])
  const manualStartTour = useCallback(() => {
    closeUserMenuIfOpen(); setStepIndex(0); setRun(false)
    setIsTourFinishedInSession(false); setShowVideoIntro(true)
  }, [])

  useEffect(() => {
    setRestart(manualStartTour, t('tour.restart'))
    return () => setRestart(null)
  }, [manualStartTour, setRestart, t])

  useEffect(() => {
    if (!run) return
    const watchdog = window.setTimeout(() => {
      setRun(false); setIsTourFinishedInSession(true); closeUserMenuIfOpen()
      tourProgress.skipTour().catch((error) => console.error('[useBusinessUserJoyride] Watchdog skipTour failed', error))
    }, 45_000)
    return () => window.clearTimeout(watchdog)
  }, [run, stepIndex, tourProgress])

  return {
    joyrideProps: buildBusinessUserJoyrideProps({ callback: handleJoyrideCallback, isMobile, run, runnableSteps, stepIndex, t }),
    shouldShowTour: tourProgress.shouldShowTour,
    isTourFinishedInSession,
    isLoading: tourProgress.isLoading,
    run,
    stepIndex,
    resetTour,
    startTour: manualStartTour,
    showVideoIntro,
    handleVideoComplete,
  }
}
