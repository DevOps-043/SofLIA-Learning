'use client'

import { useEffect, useState } from 'react'
import { useDevicePerformanceMode } from './mobile-performance'

const EASE_OUT = 'easeOut' as const

// Native replacement for framer-motion's useReducedMotion.
// Keeps framer-motion out of the initial bundle — it only loads in lazy
// authenticated chunks (~200 KB gzipped savings on cold start).
function useNativePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return prefersReduced
}

/**
 * Central motion policy for operational UI.
 *
 * Keep this hook backward compatible: existing consumers still receive
 * disableHeavy, safeTransition and loopTransition, while panel/dashboard code
 * can use the faster interface-specific helpers.
 */
export function useMotionSafe() {
  const prefersReduced = useNativePrefersReducedMotion()
  const performanceMode = useDevicePerformanceMode()
  const disableHeavy = prefersReduced || performanceMode.disableHeavyEffects
  const transitionSeconds = performanceMode.interfaceTransitionMs / 1000
  const interfaceTransition = {
    duration: transitionSeconds,
    ease: EASE_OUT,
  }

  return {
    disableHeavy,
    disablePageExitAnimations: prefersReduced || performanceMode.disablePageExitAnimations,
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
