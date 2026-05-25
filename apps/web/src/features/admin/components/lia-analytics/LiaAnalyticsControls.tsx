'use client'

import { Bot, Calendar, Download, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PremiumSelect } from '@/features/business-panel/components/PremiumSelect'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import { LIA_CHART_OPTIONS, LIA_PERIOD_OPTIONS, LIA_PROVIDER_OPTIONS } from './lia-analytics.options'
import type { LiaAnalyticsChartType, LiaAnalyticsPeriod, LiaAnalyticsProvider } from './lia-analytics.types'

interface LiaAnalyticsControlsProps {
  period: LiaAnalyticsPeriod
  provider: LiaAnalyticsProvider
  chartType: LiaAnalyticsChartType
  isLoading: boolean
  hasData: boolean
  onPeriodChange: (value: LiaAnalyticsPeriod) => void
  onProviderChange: (value: LiaAnalyticsProvider) => void
  onChartTypeChange: (value: LiaAnalyticsChartType) => void
  onRefresh: () => void
  onExport: () => void
}

export function LiaAnalyticsControls(props: LiaAnalyticsControlsProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()

  return (
    <section className="rounded-[24px] border p-4" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <PremiumSelect value={props.provider} onValueChange={(value) => props.onProviderChange(value as LiaAnalyticsProvider)} options={LIA_PROVIDER_OPTIONS} icon={<Bot className="h-4 w-4" />} />
          <PremiumSelect value={props.period} onValueChange={(value) => props.onPeriodChange(value as LiaAnalyticsPeriod)} options={LIA_PERIOD_OPTIONS.map((item) => ({ value: item.value, label: t(item.labelKey) }))} icon={<Calendar className="h-4 w-4" />} />
          <div className="flex rounded-2xl border p-1" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}>
            {LIA_CHART_OPTIONS.map((item) => <ChartButton key={item.value} value={item.value} active={props.chartType === item.value} label={t(item.labelKey)} onClick={props.onChartTypeChange} />)}
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={props.onRefresh} disabled={props.isLoading} className="rounded-2xl border px-4 py-3 text-sm font-semibold disabled:opacity-50" style={{ borderColor: theme.borderColor, color: theme.subtextColor }}><RefreshCw className={`mr-2 inline h-4 w-4 ${props.isLoading ? 'animate-spin' : ''}`} />{t('liaAnalyticsPage.actions.refresh')}</button>
          <button type="button" onClick={props.onExport} disabled={!props.hasData} className="rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-50" style={{ backgroundColor: theme.primaryColor, color: theme.onPrimaryColor }}><Download className="mr-2 inline h-4 w-4" />{t('liaAnalyticsPage.actions.exportCsv')}</button>
        </div>
      </div>
    </section>
  )
}

function ChartButton({ value, active, label, onClick }: { value: LiaAnalyticsChartType; active: boolean; label: string; onClick: (value: LiaAnalyticsChartType) => void }) {
  const theme = useAdminPanelTheme()
  return <button type="button" onClick={() => onClick(value)} className="flex-1 rounded-xl px-3 py-2 text-sm font-semibold" style={active ? { backgroundColor: theme.cardBg, color: theme.textColor } : { color: theme.subtextColor }}>{label}</button>
}
