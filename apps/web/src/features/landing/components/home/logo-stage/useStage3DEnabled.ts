'use client'

import { useEffect, useState } from 'react'
import { useReducedMotion } from 'motion/react'

/**
 * The floating 3D logo stage only runs on pointer-capable desktop viewports and
 * when the user has not requested reduced motion. Hero and ecosystem render
 * static fallbacks whenever this returns false, so the two stay in sync.
 */
export function useStage3DEnabled(): boolean {
  const reduceMotion = useReducedMotion()
  const [matchesViewport, setMatchesViewport] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 960px) and (pointer: fine)')
    const update = () => setMatchesViewport(mediaQuery.matches)

    update()
    mediaQuery.addEventListener('change', update)
    return () => mediaQuery.removeEventListener('change', update)
  }, [])

  return matchesViewport && !reduceMotion
}
