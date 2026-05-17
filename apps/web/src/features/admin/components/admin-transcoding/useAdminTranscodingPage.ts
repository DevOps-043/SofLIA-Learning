'use client'

import { useCallback, useEffect, useState } from 'react'
import type { TranscodingJobStatus } from '../../hooks/useTranscodingJobStatus'
import { fetchDiagnostics, fetchTranscodingJobs } from './api'
import { REFRESH_INTERVAL_MS } from './constants'
import type { DiagnosticsResponse, JobsApiResponse } from './types'
import { useTranscodingOperations } from './useTranscodingOperations'

export function useAdminTranscodingPage() {
  const [data, setData] = useState<JobsApiResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<TranscodingJobStatus | 'all'>('all')
  const [diagnostics, setDiagnostics] = useState<DiagnosticsResponse | null>(null)
  const [isDiagnosing, setIsDiagnosing] = useState(false)

  const runDiagnostics = useCallback(async () => {
    setIsDiagnosing(true)
    try {
      setDiagnostics(await fetchDiagnostics())
    } catch (issue) {
      setDiagnostics({
        transcodingEnabled: false,
        netlifyUrl: null,
        netlifyUrlSource: null,
        hasTranscodingInternalSecret: false,
        bgFunctionProbe: {
          reachable: null,
          status: null,
          error: issue instanceof Error ? issue.message : 'error',
        },
        summary: { healthy: false, problems: ['No se pudo ejecutar el diagnostico'] },
      })
    } finally {
      setIsDiagnosing(false)
    }
  }, [])

  const fetchJobs = useCallback(async () => {
    try {
      setData(await fetchTranscodingJobs(statusFilter))
      setError(null)
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter])

  const operations = useTranscodingOperations({ fetchJobs })
  const { isDraining, triggerDrain } = operations

  useEffect(() => { void runDiagnostics() }, [runDiagnostics])
  useEffect(() => {
    void fetchJobs()
    const interval = window.setInterval(fetchJobs, REFRESH_INTERVAL_MS)
    return () => window.clearInterval(interval)
  }, [fetchJobs])

  useEffect(() => {
    if (!data?.summary) return
    const { processing, queued } = data.summary
    if (queued > 0 && processing < 10 && !isDraining) {
      void triggerDrain()
    }
  }, [data?.summary, isDraining, triggerDrain])

  return {
    data,
    diagnostics,
    error,
    fetchJobs,
    isDiagnosing,
    isLoading,
    runDiagnostics,
    setStatusFilter,
    statusFilter,
    ...operations,
  }
}
