'use client'

import { type ReactNode, useEffect } from 'react'

import { useMotionSafe } from '../../lib/utils/motion'

interface MotionGuardProviderProps {
  children: ReactNode
}

/**
 * Centralised reduced-motion guard for heat-sensitive devices.
 *
 * Previously used framer-motion's MotionConfig to globally set
 * `reducedMotion='always'`, which pulled framer-motion (~200 KB gzipped) into
 * the initial bundle for every user — including anonymous visitors on the
 * landing page who never see a single motion.* component.
 *
 * Now uses a CSS data attribute: when disableHeavy is true we set
 * `data-reduce-motion="true"` on <html>, triggering the global CSS rule in
 * global-overrides-17.css to suppress all CSS animations on heat-sensitive
 * devices.  framer-motion components in authenticated layouts still respect the
 * system-level `prefers-reduced-motion` automatically (framer-motion's default
 * behaviour), so motion accessibility is not regressed.
 */
export function MotionGuardProvider({ children }: MotionGuardProviderProps) {
  const { disableHeavy } = useMotionSafe()

  useEffect(() => {
    if (disableHeavy) {
      document.documentElement.dataset.reduceMotion = 'true'
    } else {
      delete document.documentElement.dataset.reduceMotion
    }
  }, [disableHeavy])

  return <>{children}</>
}
