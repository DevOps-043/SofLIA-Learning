'use client'

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { BusinessReportsAnalytics } from '@/features/business-panel/components/BusinessReportsAnalytics'
import { OrganizationStylesProvider } from '@/features/business-panel/contexts/OrganizationStylesContext'
import { colors, SectionWrapper } from './shared'
import type { StatsSectionProps } from './stats-section.types'

function StatsSection({ company }: StatsSectionProps) {
  if (!company.slug) {
    return (
      <SectionWrapper>
        <div className="py-20 text-center">
          <ExclamationTriangleIcon className="mx-auto mb-4 h-10 w-10" style={{ color: colors.error }} />
          <p className="text-white/60">
            Esta organización no tiene un slug configurado, no se pueden cargar sus analíticas.
          </p>
        </div>
      </SectionWrapper>
    )
  }

  return (
    <SectionWrapper>
      <OrganizationStylesProvider orgSlug={company.slug}>
        <BusinessReportsAnalytics orgSlug={company.slug} />
      </OrganizationStylesProvider>
    </SectionWrapper>
  )
}

export { StatsSection }
