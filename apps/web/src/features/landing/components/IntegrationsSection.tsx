'use client'

import { useTranslation } from 'react-i18next'
import { useMotionSafe } from '../../../lib/utils/motion'
import { ActionsPanel } from './IntegrationsSection/ActionsPanel'
import { CapabilitiesGrid } from './IntegrationsSection/CapabilitiesGrid'
import { IntegrationsHeader } from './IntegrationsSection/Header'

interface IntegrationsSectionProps {
  className?: string
}

export function IntegrationsSection({ className = '' }: IntegrationsSectionProps) {
  const { t } = useTranslation('common')
  const { disableHeavy } = useMotionSafe()

  return (
    <section
      id="integrations"
      className={`py-20 lg:py-28 bg-gradient-to-b from-[#E9ECEF]/30 to-white dark:from-[#0A2540]/30 dark:to-[#0F1419] ${className}`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <IntegrationsHeader t={t} />
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <CapabilitiesGrid t={t} />
          <ActionsPanel t={t} disableHeavy={disableHeavy} />
        </div>
      </div>
    </section>
  )
}
