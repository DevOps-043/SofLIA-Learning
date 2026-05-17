'use client'

import { ChartPie } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import { ContextDistributionChart } from './context-distribution/ContextDistributionChart'
import { ContextDistributionLegend } from './context-distribution/ContextDistributionLegend'
import { ContextDistributionLoading } from './context-distribution/ContextDistributionLoading'
import { useContextDistributionData } from './context-distribution/useContextDistributionData'
import type { ContextData } from './context-distribution/types'

interface ContextDistributionWidgetProps {
  data: ContextData[]
  isLoading?: boolean
}

export function ContextDistributionWidget({ data, isLoading }: ContextDistributionWidgetProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()
  const { chartData, totals } = useContextDistributionData(data, t)

  if (isLoading) return <ContextDistributionLoading />

  return (
    <section className="rounded-[24px] border p-6" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="flex items-center gap-2 text-base font-semibold" style={{ color: theme.textColor }}>
            <ChartPie className="h-5 w-5" style={{ color: theme.primaryColor }} />
            {t('liaAnalyticsPage.contextDistribution.title')}
          </h3>
          <p className="text-sm" style={{ color: theme.subtextColor }}>
            {t('liaAnalyticsPage.contextDistribution.subtitle', { conversations: totals.conversations, cost: totals.cost.toFixed(4) })}
          </p>
        </div>
      </div>

      {chartData.length ? (
        <div className="flex flex-col items-center gap-4 lg:flex-row">
          <ContextDistributionChart data={chartData} />
          <ContextDistributionLegend data={chartData} />
        </div>
      ) : (
        <div className="flex h-56 items-center justify-center text-sm" style={{ color: theme.subtextColor }}>
          {t('liaAnalyticsPage.contextDistribution.empty')}
        </div>
      )}
    </section>
  )
}
