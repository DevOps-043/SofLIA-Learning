'use client'

import { type ReactNode } from 'react'
import { MotionConfig } from 'framer-motion'

import { useMotionSafe } from '../../lib/utils/motion'

interface MotionGuardProviderProps {
  children: ReactNode
}

/**
 * Centralised framer-motion throttle for heat-sensitive devices.
 *
 * Wraps the entire client tree in a MotionConfig with reducedMotion='always'
 * whenever useMotionSafe().disableHeavy is true (Apple platforms, WebKit,
 * prefers-reduced-motion users, low-end devices).  Inside that subtree
 * every motion.* component skips its animations and transitions — no
 * per-frame value computation, no GPU compositing for transforms that
 * weren't going to be visible anyway.
 *
 * This complements the CSS-level rules in globals.css that hide
 * decorative blur orbs: this hook addresses the JS-side cost (framer
 * value drivers), the CSS addresses the GPU-side cost (composition
 * layers).  Together they eliminate the bulk of landing-page heat.
 *
 * For animations that should always run (loading spinners, etc.),
 * use the `transition={false}` escape hatch on the individual motion
 * component or wrap that subtree in another MotionConfig with
 * `reducedMotion='never'`.
 */
export function MotionGuardProvider({ children }: MotionGuardProviderProps) {
  const { disableHeavy } = useMotionSafe()

  return (
    <MotionConfig reducedMotion={disableHeavy ? 'always' : 'user'}>
      {children}
    </MotionConfig>
  )
}
