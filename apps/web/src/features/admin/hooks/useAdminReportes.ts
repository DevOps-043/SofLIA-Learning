'use client'

import { useCallback, useEffect, useState } from 'react'
import type {
  AdminReporte,
  ReporteFilters,
  ReporteStats,
  ReporteUpdateData,
} from '../services/adminReportes.service'
import {
  EMPTY_REPORTE_STATS,
  fetchAdminReportes,
  patchAdminReporte,
} from './admin-reportes.api'

export function useAdminReportes() {
  const [reportes, setReportes] = useState<AdminReporte[]>([])
  const [stats, setStats] = useState<ReporteStats>(EMPTY_REPORTE_STATS)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<ReporteFilters>({})

  const fetchReportes = useCallback(async (activeFilters: ReporteFilters) => {
    try {
      setIsLoading(true)
      setError(null)
      const payload = await fetchAdminReportes(activeFilters)
      setReportes(payload.reportes)
      setStats(payload.stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'load_failed')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateReporte = async (reporteId: string, updates: ReporteUpdateData) => {
    await patchAdminReporte(reporteId, updates)
    await fetchReportes(filters)
    return { success: true }
  }

  const refetch = () => {
    fetchReportes(filters)
  }

  const applyFilters = (newFilters: ReporteFilters) => {
    setFilters(newFilters)
    fetchReportes(newFilters)
  }

  useEffect(() => {
    fetchReportes({})
  }, [fetchReportes])

  return {
    reportes,
    stats,
    isLoading,
    error,
    filters,
    refetch,
    updateReporte,
    applyFilters,
  }
}
