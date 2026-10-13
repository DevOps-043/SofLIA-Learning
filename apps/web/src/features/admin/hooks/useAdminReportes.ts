'use client'

import { useState } from 'react'
import useSWR from 'swr'
import type {
  ReporteFilters,
  ReporteUpdateData,
} from '../services/adminReportes.service'
import {
  EMPTY_REPORTE_STATS,
  fetchAdminReportes,
  patchAdminReporte,
} from './admin-reportes.api'

export function useAdminReportes() {
  const [filters, setFilters] = useState<ReporteFilters>({})
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    ['/api/admin/reportes', filters] as const,
    ([, activeFilters]) => fetchAdminReportes(activeFilters),
    { keepPreviousData: true, revalidateOnFocus: false },
  )

  const updateReporte = async (reporteId: string, updates: ReporteUpdateData) => {
    await patchAdminReporte(reporteId, updates)
    await mutate()
    return { success: true }
  }

  const refetch = async () => { await mutate() }

  const applyFilters = (newFilters: ReporteFilters) => {
    setFilters(newFilters)
    // Applying the same filters also acts as an explicit refresh.
    if (JSON.stringify(newFilters) === JSON.stringify(filters)) void mutate()
  }

  return {
    reportes: data?.reportes ?? [],
    stats: data?.stats ?? EMPTY_REPORTE_STATS,
    isLoading: isLoading && !data,
    isValidating,
    hasLoadedData: data !== undefined,
    error: error ? (error instanceof Error ? error.message : 'load_failed') : null,
    filters,
    refetch,
    updateReporte,
    applyFilters,
  }
}
