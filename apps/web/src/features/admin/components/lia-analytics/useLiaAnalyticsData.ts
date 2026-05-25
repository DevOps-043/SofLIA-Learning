'use client'

import { useCallback, useEffect, useState } from 'react'
import { fetchLiaAnalytics } from './lia-analytics.api'
import type { LiaAnalyticsData, LiaAnalyticsPeriod, LiaAnalyticsProvider } from './lia-analytics.types'

export function useLiaAnalyticsData(period: LiaAnalyticsPeriod, provider: LiaAnalyticsProvider) {
  const [data, setData] = useState<LiaAnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const refetch = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      setData(await fetchLiaAnalytics(period, provider))
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'load_failed')
    } finally {
      setIsLoading(false)
    }
  }, [period, provider])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { data, isLoading, error, lastUpdated, refetch }
}
