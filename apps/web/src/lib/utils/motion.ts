'use client'

import { useReducedMotion } from 'framer-motion'
import { useDevicePerformanceMode } from './mobile-performance'

const EASE_OUT = 'easeOut' as const

/**
 * Central motion policy for operational UI.
 *
 * Keep this hook backward compatible: existing consumers still receive
 * disableHeavy, safeTransition and loopTransition, while panel/dashboard code
 * can use the faster interface-specific helpers.
 */
export function useMotionSafe() {
  const prefersReduced = useReducedMotion()
  const performanceMode = useDevicePerformanceMode()
  const disableHeavy = Boolean(prefersReduced) || performanceMode.disableHeavyEffects
  const transitionSeconds = performanceMode.interfaceTransitionMs / 1000
  const interfaceTransition = {
    duration: transitionSeconds,
    ease: EASE_OUT,
  }

  return {
    disableHeavy,
    disablePageExitAnimations:
      Boolean(prefersReduced) || performanceMode.disablePageExitAnimations,
    interfaceMotionMode: performanceMode.interfaceMotionMode,
    interfaceStaggerSeconds: performanceMode.interfaceStaggerMs / 1000,
    interfaceTransition,
    panelPresenceMode: performanceMode.disablePageExitAnimations
      ? undefined
      : ('sync' as const),
    panelTransition: interfaceTransition,
    safeTransition: disableHeavy
      ? interfaceTransition
      : { type: 'spring' as const, stiffness: 300, damping: 25 },
    loopTransition: (config: object) => (disableHeavy ? { duration: 0 } : config),
  }
}
