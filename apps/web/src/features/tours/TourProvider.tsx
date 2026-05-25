'use client'

import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'

// react-joyride accesses browser globals at module init time; loading it as a
// separate client chunk prevents webpack factory failures in the layout bundle.
const TourRenderer = dynamic(
  () => import('./components/TourRenderer').then((m) => m.TourRenderer),
  { ssr: false },
)

export function TourProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <TourRenderer />
    </>
  )
}
