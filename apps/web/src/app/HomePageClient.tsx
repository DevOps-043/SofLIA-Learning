'use client'

import React from 'react'
import {
  CapabilitiesGrid,
  FinalCTASection,
  HeroSectionB2B,
  IntegrationsSection,
  LandingFAQSection,
  LandingFooter,
  LandingHeader,
  PlatformOverview,
  ROIImpactSection,
  SecuritySection,
  TrustSection,
  UseCasesSection,
} from '../features/landing'
import { PWAPrompt } from '../core/components/PWAPrompt'

export function HomePageClient() {
  return (
    <main className="bg-white dark:bg-gray-900 transition-colors duration-300">
      <LandingHeader />
      <HeroSectionB2B />
      <TrustSection />
      <PlatformOverview />
      <CapabilitiesGrid />
      <UseCasesSection />
      <ROIImpactSection />
      <IntegrationsSection />
      <SecuritySection />
      <LandingFAQSection />
      <FinalCTASection />
      <LandingFooter />
      <PWAPrompt />
    </main>
  )
}
