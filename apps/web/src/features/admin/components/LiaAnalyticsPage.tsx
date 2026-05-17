'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { exportLiaAnalyticsCsv } from './lia-analytics/lia-analytics.api'
import { LiaAnalyticsControls } from './lia-analytics/LiaAnalyticsControls'
import { LiaAnalyticsHeader } from './lia-analytics/LiaAnalyticsHeader'
import { LiaAnalyticsInfoBanner } from './lia-analytics/LiaAnalyticsInfoBanner'
import { LiaAnalyticsWidgetsGrid } from './lia-analytics/LiaAnalyticsWidgetsGrid'
import { useLiaAnalyticsData } from './lia-analytics/useLiaAnalyticsData'
import type { LiaAnalyticsChartType, LiaAnalyticsPeriod, LiaAnalyticsProvider } from './lia-analytics/lia-analytics.types'

export function LiaAnalyticsPage() {
  const { t } = useTranslation('admin')
  const [period, setPeriod] = useState<LiaAnalyticsPeriod>('month')
  const [provider, setProvider] = useState<LiaAnalyticsProvider>('openai')
  const [chartType, setChartType] = useState<LiaAnalyticsChartType>('area')
  const { data, isLoading, lastUpdated, refetch } = useLiaAnalyticsData(period, provider)

  return (
    <div className="mx-auto max-w-[1800px] space-y-6 p-4 md:p-6">
      <LiaAnalyticsHeader lastUpdated={lastUpdated} />
      <LiaAnalyticsControls
        period={period}
        provider={provider}
        chartType={chartType}
        isLoading={isLoading}
        hasData={!!data}
        onPeriodChange={setPeriod}
        onProviderChange={setProvider}
        onChartTypeChange={setChartType}
        onRefresh={refetch}
        onExport={() => data ? exportLiaAnalyticsCsv(data, period, [
          t('liaAnalyticsPage.csv.date'),
          t('liaAnalyticsPage.csv.cost'),
          t('liaAnalyticsPage.csv.tokens'),
          t('liaAnalyticsPage.csv.messages'),
        ]) : undefined}
      />
      <LiaAnalyticsWidgetsGrid data={data} isLoading={isLoading} chartType={chartType} period={period} />
      <LiaAnalyticsInfoBanner />
    </div>
  )
}
