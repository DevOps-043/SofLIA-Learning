'use client'

import { useMemo } from 'react'
import type { TFunction } from 'i18next'
import { CONTEXT_COLORS, CONTEXT_LABEL_KEYS } from './context-distribution.config'
import type { ChartContextData, ContextData } from './types'

export function useContextDistributionData(data: ContextData[], t: TFunction) {
  const chartData = useMemo<ChartContextData[]>(() => data.map((item) => ({
    ...item,
    name: t(CONTEXT_LABEL_KEYS[item.contextType] || item.contextType, { defaultValue: item.contextType }),
    color: CONTEXT_COLORS[item.contextType] || CONTEXT_COLORS.default,
  })), [data, t])

  const totals = useMemo(() => ({
    conversations: data.reduce((sum, item) => sum + item.count, 0),
    cost: data.reduce((sum, item) => sum + item.cost, 0),
  }), [data])

  return { chartData, totals }
}
