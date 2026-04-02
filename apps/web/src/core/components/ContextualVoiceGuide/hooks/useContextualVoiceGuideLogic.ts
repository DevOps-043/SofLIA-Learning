'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useLanguage } from '../../../providers/I18nProvider'
import { ContextualVoiceGuideProps } from '../types'
import { useAuth } from '../../../../features/auth/hooks/useAuth'
import { useContextualVoiceGuideVoice } from './useContextualVoiceGuideVoice'
import {
  buildContextualVoiceGuideStorageKey,
  hasSeenContextualVoiceGuideTour,
  markContextualVoiceGuideTourAsSeen,
  shouldAutoOpenContextualVoiceGuide,
} from '../services/contextual-voice-guide-storage.service'

export function useContextualVoiceGuideLogic({
  tourId,
  steps,
  triggerPaths,
  showDelay = 1000,
  requireAuth = false,
}: ContextualVoiceGuideProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { language } = useLanguage()
  const { user } = useAuth()

  const [isVisible, setIsVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  const hasAttemptedOpenRef = useRef(false)
  const isOpeningRef = useRef(false)
  const onboardingSteps = steps
  const storageKey = useMemo(() => buildContextualVoiceGuideStorageKey(tourId), [tourId])
  const step = onboardingSteps[currentStep]

  const { isSpeaking, speakText, stopAllAudio } = useContextualVoiceGuideVoice({
    isVisible,
    isAudioEnabled,
    language,
  })

  const persistSeenTour = useCallback(() => {
    markContextualVoiceGuideTourAsSeen(storageKey)
    hasAttemptedOpenRef.current = true
  }, [storageKey])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (hasSeenContextualVoiceGuideTour(storageKey)) {
      hasAttemptedOpenRef.current = true
      return
    }

    if (isOpeningRef.current || hasAttemptedOpenRef.current || isVisible) {
      return
    }

    if (requireAuth && !user) {
      return
    }

    if (!shouldAutoOpenContextualVoiceGuide(pathname, triggerPaths)) {
      return
    }

    hasAttemptedOpenRef.current = true
    isOpeningRef.current = true

    const timer = window.setTimeout(() => {
      if (!hasSeenContextualVoiceGuideTour(storageKey)) {
        setCurrentStep(0)
        setIsVisible(true)
        persistSeenTour()
      }

      isOpeningRef.current = false
    }, showDelay)

    return () => {
      window.clearTimeout(timer)
      isOpeningRef.current = false
    }
  }, [isVisible, pathname, persistSeenTour, requireAuth, showDelay, storageKey, triggerPaths, user])

  useEffect(() => {
    const eventName = `open-tour-${tourId}`

    const handleOpenTour = () => {
      isOpeningRef.current = true
      setCurrentStep(0)
      setIsVisible(true)

      window.setTimeout(() => {
        isOpeningRef.current = false
      }, 100)
    }

    window.addEventListener(eventName, handleOpenTour)

    return () => {
      window.removeEventListener(eventName, handleOpenTour)
    }
  }, [tourId])

  useEffect(() => {
    if (!isVisible || !isAudioEnabled || !step?.speech) {
      return
    }

    const timer = window.setTimeout(() => {
      void speakText(step.speech)
    }, currentStep === 0 ? 500 : 150)

    return () => window.clearTimeout(timer)
  }, [currentStep, isAudioEnabled, isVisible, speakText, step?.speech])

  const handleSkip = useCallback(() => {
    stopAllAudio()
    persistSeenTour()
    setIsVisible(false)
  }, [persistSeenTour, stopAllAudio])

  const handleComplete = useCallback(() => {
    stopAllAudio()
    persistSeenTour()
    setIsVisible(false)

    const lastStep = onboardingSteps[onboardingSteps.length - 1]
    if (lastStep?.action) {
      router.push(lastStep.action.path)
    }
  }, [onboardingSteps, persistSeenTour, router, stopAllAudio])

  const handleNext = useCallback(() => {
    stopAllAudio()

    const nextStep = currentStep + 1
    if (nextStep < onboardingSteps.length) {
      setCurrentStep(nextStep)
      return
    }

    handleComplete()
  }, [currentStep, handleComplete, onboardingSteps.length, stopAllAudio])

  const handlePrevious = useCallback(() => {
    if (currentStep === 0) {
      return
    }

    stopAllAudio()
    setCurrentStep((previousStep) => Math.max(previousStep - 1, 0))
  }, [currentStep, stopAllAudio])

  const handleActionClick = useCallback(() => {
    if (!step?.action) {
      return
    }

    stopAllAudio()
    persistSeenTour()
    setIsVisible(false)
    router.push(step.action.path)
  }, [persistSeenTour, router, step, stopAllAudio])

  const toggleAudio = useCallback(() => {
    setIsAudioEnabled((previousState) => {
      const nextState = !previousState
      if (!nextState) {
        stopAllAudio()
      }
      return nextState
    })
  }, [stopAllAudio])

  return {
    isVisible,
    currentStep,
    isAudioEnabled,
    isSpeaking,
    isMobile,
    ONBOARDING_STEPS: onboardingSteps,
    step,
    handleNext,
    handlePrevious,
    handleSkip,
    handleComplete,
    handleActionClick,
    toggleAudio,
  }
}
