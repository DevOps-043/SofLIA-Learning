'use client'

import { LandingHeader } from '../features/landing/components/LandingHeader'

export function HomePageClient() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <LandingHeader />
    </main>
  )
}
