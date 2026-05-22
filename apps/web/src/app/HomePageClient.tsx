'use client'

import { useEffect, useState } from 'react'
import type { ComponentType } from 'react'
import { HeroSectionB2B } from '../features/landing/components/HeroSectionB2B'
import { LandingHeader } from '../features/landing/components/LandingHeader'
import { LazyLandingModule } from '../features/landing/components/lazy-section/LazyLandingSection'

const loadTrustSection = () =>
  import('../features/landing/components/TrustSection').then(
    (module) => module.TrustSection,
  )

const loadPlatformOverview = () =>
  import('../features/landing/components/PlatformOverview').then(
    (module) => module.PlatformOverview,
  )

const loadCapabilitiesGrid = () =>
  import('../features/landing/components/CapabilitiesGrid').then(
    (module) => module.CapabilitiesGrid,
  )

const loadUseCasesSection = () =>
  import('../features/landing/components/UseCasesSection').then(
    (module) => module.UseCasesSection,
  )

const loadROIImpactSection = () =>
  import('../features/landing/components/ROIImpactSection').then(
    (module) => module.ROIImpactSection,
  )

const loadIntegrationsSection = () =>
  import('../features/landing/components/IntegrationsSection').then(
    (module) => module.IntegrationsSection,
  )

const loadSecuritySection = () =>
  import('../features/landing/components/SecuritySection').then(
    (module) => module.SecuritySection,
  )

const loadLandingFAQSection = () =>
  import('../features/landing/components/LandingFAQSection').then(
    (module) => module.FAQSection,
  )

const loadFinalCTASection = () =>
  import('../features/landing/components/FinalCTASection').then(
    (module) => module.FinalCTASection,
  )

const loadLandingFooter = () =>
  import('../features/landing/components/LandingFooter').then(
    (module) => module.LandingFooter,
  )

const loadPWAPrompt = () =>
  import('../core/components/PWAPrompt').then((module) => module.PWAPrompt)

function DeferredPWAPrompt() {
  const [PromptComponent, setPromptComponent] = useState<ComponentType | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    let isCancelled = false
    const loadPrompt = () => {
      loadPWAPrompt().then((Component) => {
        if (!isCancelled) {
          setPromptComponent(() => Component)
        }
      })
    }

    const windowWithIdleCallback = window as Window & {
      cancelIdleCallback?: (id: number) => void
      requestIdleCallback?: (
        callback: IdleRequestCallback,
        options?: IdleRequestOptions,
      ) => number
    }

    if (windowWithIdleCallback.requestIdleCallback) {
      const idleId = windowWithIdleCallback.requestIdleCallback(loadPrompt, {
        timeout: 4000,
      })

      return () => {
        isCancelled = true
        windowWithIdleCallback.cancelIdleCallback?.(idleId)
      }
    }

    const timeoutId = window.setTimeout(loadPrompt, 1500)
    return () => {
      isCancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [])

  return PromptComponent ? <PromptComponent /> : null
}

export function HomePageClient() {
  return (
    <main className="bg-white dark:bg-gray-900 transition-colors duration-300">
      <LandingHeader />
      <HeroSectionB2B />
      <LazyLandingModule load={loadTrustSection} minHeightClassName="min-h-[520px]" />
      <LazyLandingModule
        anchorId="platform"
        load={loadPlatformOverview}
        minHeightClassName="min-h-[760px]"
      />
      <LazyLandingModule
        load={loadCapabilitiesGrid}
        minHeightClassName="min-h-[760px]"
      />
      <LazyLandingModule
        load={loadUseCasesSection}
        minHeightClassName="min-h-[700px]"
      />
      <LazyLandingModule
        load={loadROIImpactSection}
        minHeightClassName="min-h-[620px]"
      />
      <LazyLandingModule
        anchorId="integrations"
        load={loadIntegrationsSection}
        minHeightClassName="min-h-[760px]"
      />
      <LazyLandingModule
        load={loadSecuritySection}
        minHeightClassName="min-h-[700px]"
      />
      <LazyLandingModule
        load={loadLandingFAQSection}
        minHeightClassName="min-h-[620px]"
      />
      <LazyLandingModule
        anchorId="contact"
        load={loadFinalCTASection}
        minHeightClassName="min-h-[760px]"
      />
      <LazyLandingModule load={loadLandingFooter} minHeightClassName="min-h-[360px]" />
      <DeferredPWAPrompt />
    </main>
  )
}
