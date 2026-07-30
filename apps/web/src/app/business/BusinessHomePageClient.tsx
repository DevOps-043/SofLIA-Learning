'use client'

import { CTASection } from '../../features/landing/components/CTASection'
import { FeaturesSection } from '../../features/landing/components/FeaturesSection'
import { HeroBusinessSection } from '../../features/landing/components/business/HeroBusinessSection'
import { InstructorsSection } from '../../features/landing/components/business/InstructorsSection'
import { BusinessErrorState } from './business-home/ErrorState'
import { BusinessLoadingState } from './business-home/LoadingState'
import { BusinessStatsSection } from './business-home/StatsSection'
import { BusinessUseCasesSection } from './business-home/UseCasesSection'
import { useBusinessHomeContent } from './business-home/useBusinessHomeContent'

export function BusinessHomePageClient() {
  const { content, loading, error } = useBusinessHomeContent()

  if (loading) {
    return <BusinessLoadingState />
  }

  if (error || !content) {
    return <BusinessErrorState message={error || 'No se pudo cargar el contenido'} />
  }

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      <HeroBusinessSection content={content.hero} />
      <BusinessStatsSection />
      <BusinessUseCasesSection />
      <FeaturesSection
        title={content.benefits.title}
        subtitle={content.benefits.subtitle}
        cards={content.benefits.cards}
      />
      <InstructorsSection
        title={content.instructors.title}
        subtitle={content.instructors.subtitle}
        instructors={content.instructors.items}
      />
      <CTASection
        title={content.cta.title}
        subtitle={content.cta.subtitle}
        buttonText={content.cta.buttonText}
      />
    </main>
  )
}
