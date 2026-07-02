'use client'

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { StatusComponentKey } from '@aprende-y-aplica/shared'

import { useThemeStore } from '@/core/stores/themeStore'
import { TimeSeriesChart } from '../AdvancedCharts/TimeSeriesChart'
import type { AdminStatusCheck } from './types'

interface LatencyChartProps {
  checks: AdminStatusCheck[]
  componentKey: StatusComponentKey
}

export function LatencyChart({ checks, componentKey }: LatencyChartProps) {
  const { t } = useTranslation('admin')
  const { resolvedTheme } = useThemeStore()

  const data = useMemo(
    () =>
      checks
        .filter((check) => check.componentKey === componentKey)
        .slice()
        .reverse()
        .map((check) => ({
          date: new Date(check.checkedAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          value: check.latencyMs,
        })),
    [checks, componentKey],
  )

  if (data.length === 0) return null

  return (
    <TimeSeriesChart
      data={data}
      dataKey="value"
      darkMode={resolvedTheme === 'dark'}
      title={`${t(`systemStatus.components.${componentKey}`)} — ${t('systemStatus.latencyChartTitle')}`}
    />
  )
}
