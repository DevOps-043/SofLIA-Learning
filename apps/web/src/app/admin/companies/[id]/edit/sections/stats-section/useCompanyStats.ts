'use client'

import { useEffect, useState } from 'react'
import type { StatsData } from './types'

export function useCompanyStats(companyId: string) {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/admin/companies/${companyId}/stats`)
        const data = await response.json()
        if (data.success) setStats(data.stats)
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    void fetchStats()
  }, [companyId])

  return { loading, stats }
}
