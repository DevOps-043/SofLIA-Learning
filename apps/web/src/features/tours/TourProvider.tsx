'use client'

import type { ReactNode } from 'react'

import { TourRenderer } from './components/TourRenderer'
import { useTourStore } from './tour.store'

export function TourProvider({ children }: { children: ReactNode }) {
  const shouldRenderTour = useTourStore(
    (state) => state.isRunning && Boolean(state.activeTourConfig),
  )

  return (
    <>
      {children}
      {shouldRenderTour ? <TourRenderer /> : null}
    </>
  )
}
