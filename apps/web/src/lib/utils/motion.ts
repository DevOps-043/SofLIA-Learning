'use client'

import { useReducedMotion } from 'framer-motion'
import { useDevicePerformanceMode } from './mobile-performance'

/**
 * Returns whether heavy/infinite animations should be disabled.
 * Disables on mobile (<= 768px) and when prefers-reduced-motion is set.
 *
 * Usage:
 *   const { disableHeavy } = useMotionSafe()
 *   // Then: if (!disableHeavy) render the infinite animation
 */
export function useMotionSafe() {
  const prefersReduced = useReducedMotion()
  const performanceMode = useDevicePerformanceMode()
  const disableHeavy = Boolean(prefersReduced) || performanceMode.disableHeavyEffects

  return {
    /** true on mobile or prefers-reduced-motion → skip infinite/heavy animations */
    disableHeavy,
    /** Safe transition for entrance animations (fast on mobile) */
    safeTransition: disableHeavy
      ? { duration: 0.15, ease: 'easeOut' as const }
      : { type: 'spring' as const, stiffness: 300, damping: 25 },
    /** For infinite loop transitions: undefined on desktop, {duration:0} on mobile */
    loopTransition: (config: object) =>
      disableHeavy ? { duration: 0 } : config,
  }
}
