'use client'

import { useEffect, useState } from 'react'

const MOBILE_PERFORMANCE_BREAKPOINT_PX = 768

export function useMobilePerformanceMode() {
  const [isMobileViewport, setIsMobileViewport] = useState(false)
  const [isCoarsePointer, setIsCoarsePointer] = useState(false)

  useEffect(() => {
    const viewportQuery = window.matchMedia(
      `(max-width: ${MOBILE_PERFORMANCE_BREAKPOINT_PX}px)`
    )
    const coarsePointerQuery = window.matchMedia('(pointer: coarse)')

    const sync = () => {
      setIsMobileViewport(viewportQuery.matches)
      setIsCoarsePointer(coarsePointerQuery.matches)
    }

    sync()
    viewportQuery.addEventListener('change', sync)
    coarsePointerQuery.addEventListener('change', sync)

    return () => {
      viewportQuery.removeEventListener('change', sync)
      coarsePointerQuery.removeEventListener('change', sync)
    }
  }, [])

  return {
    disableHeavyEffects: isMobileViewport || isCoarsePointer,
    isMobileViewport,
  }
}
