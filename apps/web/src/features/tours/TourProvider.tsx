'use client'

import type { ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { useTourStore } from './tour.store'

// TourRenderer is dynamic so react-joyride (~80 KB gzipped) is NOT included
// in the initial bundle. It is only fetched when shouldRenderTour becomes true,
// which virtually never happens before the user is fully authenticated and has
// navigated to a page with an active tour.
const TourRenderer = dynamic(
  () => import('./components/TourRenderer').then((m) => ({ default: m.TourRenderer })),
  { ssr: false },
)

export function TourProvider({ children }: { children: ReactNode }) {
  const shouldRenderTour = useTourStore(
    (state) =>
      (state.isRunning || Boolean(state.introVideoUrl)) &&
      Boolean(state.activeTourConfig),
  )

  return (
    <>
      {children}
      {shouldRenderTour ? <TourRenderer /> : null}
    </>
  )
}
