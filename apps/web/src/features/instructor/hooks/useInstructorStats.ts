'use client'

import { useState, useEffect, useCallback } from 'react'
import { InstructorStatsService, DetailedInstructorStats } from '../services/instructorStats.service'

export function useInstructorStats(initialPeriod: string = '1month') {
  const [stats, setStats] = useState<DetailedInstructorStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState(initialPeriod)

  const fetchStats = useCallback(async (selectedPeriod?: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const periodToUse = selectedPeriod || period
      const data = await InstructorStatsService.getDetailedStats(periodToUse)
      
      setStats(data)
      if (selectedPeriod) {
        setPeriod(selectedPeriod)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar las estadísticas'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchStats()
  }, []) // Solo al montar, luego usar refetch con período

  const refetch = useCallback((selectedPeriod?: string) => {
    return fetchStats(selectedPeriod)
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    period,
    refetch,
    setPeriod
  }
}

