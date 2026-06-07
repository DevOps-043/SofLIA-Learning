'use client'

import { useEffect, useState } from 'react'
import { useDevicePerformanceMode } from '@/lib/utils/mobile-performance'

interface StudyPlannerPanelStyles {
  primary_button_color?: string | null
  secondary_button_color?: string | null
  accent_color?: string | null
  sidebar_background?: string | null
  card_background?: string | null
  text_color?: string | null
}

export function useStudyPlannerLIAViewState(styles?: { panel?: StudyPlannerPanelStyles | null } | null) {
  const performanceMode = useDevicePerformanceMode()
  const [isVisible, setIsVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [isAudioEnabled, setIsAudioEnabled] = useState(false)
  const [hasUserInteracted, setHasUserInteracted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsAudioEnabled((current) => current || !performanceMode.disableAutoplayAudio)
  }, [performanceMode.disableAutoplayAudio])

  useEffect(() => {
    if (!styles?.panel || typeof document === 'undefined') {
      return
    }

    const root = document.documentElement
    const panelStyles = styles.panel

    if (panelStyles.primary_button_color) {
      root.style.setProperty('--color-primary', panelStyles.primary_button_color)
    }
    if (panelStyles.secondary_button_color) {
      root.style.setProperty('--color-secondary', panelStyles.secondary_button_color)
    }
    if (panelStyles.accent_color) {
      root.style.setProperty('--color-accent', panelStyles.accent_color)
    }
    if (panelStyles.sidebar_background) {
      root.style.setProperty('--color-bg-dark', panelStyles.sidebar_background)
    }
    if (panelStyles.card_background) {
      root.style.setProperty('--color-bg-card', panelStyles.card_background)
    }
    if (panelStyles.text_color) {
      root.style.setProperty('--color-text-primary', panelStyles.text_color)
    }
  }, [styles])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return {
    isVisible,
    setIsVisible,
    currentStep,
    setCurrentStep,
    isAudioEnabled,
    setIsAudioEnabled,
    hasUserInteracted,
    setHasUserInteracted,
    isMobile,
    setIsMobile,
  }
}
