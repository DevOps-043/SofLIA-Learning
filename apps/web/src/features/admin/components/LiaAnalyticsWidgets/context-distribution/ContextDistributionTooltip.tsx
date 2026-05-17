'use client'

import { useTranslation } from 'react-i18next'
import type { ContextTooltipProps } from './types'

export function ContextDistributionTooltip({ active, payload }: ContextTooltipProps) {
  const { t } = useTranslation('admin')
  const data = payload?.[0]?.payload
  if (!active || !data) return null

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-950 p-3 shadow-xl">
      <div className="mb-2 flex items-center gap-2">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: data.color }} />
        <p className="font-medium text-white">{data.name}</p>
      </div>
      <div className="space-y-1 text-sm text-slate-300">
        <p>{t('liaAnalyticsPage.contextDistribution.tooltip.conversations')}: <span className="font-semibold text-white">{data.count}</span></p>
        <p>{t('liaAnalyticsPage.contextDistribution.tooltip.cost')}: <span className="font-semibold text-white">${data.cost.toFixed(4)}</span></p>
        <p>{t('liaAnalyticsPage.contextDistribution.tooltip.tokens')}: <span className="font-semibold text-white">{data.tokens.toLocaleString()}</span></p>
        <p>{t('liaAnalyticsPage.contextDistribution.tooltip.percentage')}: <span className="font-semibold text-white">{data.percentage}%</span></p>
      </div>
    </div>
  )
}
