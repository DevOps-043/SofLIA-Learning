'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import type {
  ReportsAnalyticsAiInsights,
  ReportsAnalyticsExportFormat,
  ReportsAnalyticsInsightsResponse,
  ReportsAnalyticsResponse,
  ReportsAnalyticsTimeGranularity,
} from '../types/reports-analytics.types'

export interface BusinessReportsAnalyticsClientFilters {
  from: string
  to: string
  granularity: ReportsAnalyticsTimeGranularity
  courseId: string
  gender: string
  ageBand: string
  jobTitle: string
  role: string
  status: string
  regionId: string
  zoneId: string
  teamId: string
}

class ApiJsonResponseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ApiJsonResponseError'
  }
}

export function useBusinessReportsAnalytics() {
  const params = useParams()
  const orgSlug = params?.orgSlug as string
  const [filters, setFilters] = useState<BusinessReportsAnalyticsClientFilters>(() => getDefaultFilters())
  const [data, setData] = useState<ReportsAnalyticsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState<ReportsAnalyticsExportFormat | null>(null)
  const [insights, setInsights] = useState<ReportsAnalyticsAiInsights | null>(null)
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false)
  const [isExportingInsightsPdf, setIsExportingInsightsPdf] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const queryString = useMemo(() => buildQueryString(filters), [filters])

  const fetchAnalytics = useCallback(async () => {
    if (!orgSlug) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/${orgSlug}/business/reports-analytics?${queryString}`, {
        credentials: 'include',
      })
      const payload = await readApiJson<ReportsAnalyticsResponse & { error?: string }>(
        response,
        'analytics_fetch_failed',
      )

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'analytics_fetch_failed')
      }

      setData(payload as ReportsAnalyticsResponse)
      setInsights(null)
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'analytics_fetch_failed')
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }, [orgSlug, queryString])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const updateFilter = useCallback(
    (key: keyof BusinessReportsAnalyticsClientFilters, value: string) => {
      setFilters((current) => ({
        ...current,
        [key]: value,
        ...(key === 'regionId' ? { zoneId: '', teamId: '' } : {}),
        ...(key === 'zoneId' ? { teamId: '' } : {}),
      }))
    },
    [],
  )

  const resetFilters = useCallback(() => {
    setFilters(getDefaultFilters())
  }, [])

  const exportAnalytics = useCallback(
    async (format: ReportsAnalyticsExportFormat, locale: string) => {
      if (!orgSlug) return

      setIsExporting(format)
      setError(null)

      try {
        const response = await fetch(`/api/${orgSlug}/business/reports-analytics`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            ...compactFilters(filters),
            format,
            locale,
          }),
        })

        if (!response.ok) {
          const payload = await readApiJson<{ error?: string }>(response, 'analytics_export_failed').catch(() => null)
          throw new Error(payload?.error || 'analytics_export_failed')
        }

        const blob = await response.blob()
        const filename = getFilenameFromResponse(response) || getFallbackFilename(format)
        downloadBlob(blob, filename)
      } catch (exportError) {
        setError(exportError instanceof Error ? exportError.message : 'analytics_export_failed')
      } finally {
        setIsExporting(null)
      }
    },
    [filters, orgSlug],
  )

  const generateInsights = useCallback(
    async (locale: string) => {
      if (!orgSlug || !data) return

      setIsGeneratingInsights(true)
      setError(null)

      try {
        const response = await fetch(`/api/${orgSlug}/business/reports-analytics/insights`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            ...compactFilters(filters),
            locale,
          }),
        })
        const payload = await readApiJson<ReportsAnalyticsInsightsResponse & { error?: string }>(
          response,
          'analytics_insights_failed',
        )

        if (!response.ok || !payload.success) {
          throw new Error(payload.error || 'analytics_insights_failed')
        }

        setInsights((payload as ReportsAnalyticsInsightsResponse).insights)
      } catch (insightsError) {
        setError(insightsError instanceof Error ? insightsError.message : 'analytics_insights_failed')
      } finally {
        setIsGeneratingInsights(false)
      }
    },
    [data, filters, orgSlug],
  )

  const exportInsightsPdf = useCallback(
    async (locale: string) => {
      if (!orgSlug || !data) return

      setIsExportingInsightsPdf(true)
      setError(null)

      try {
        const response = await fetch(`/api/${orgSlug}/business/reports-analytics/insights`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            ...compactFilters(filters),
            locale,
            format: 'pdf',
          }),
        })

        if (!response.ok) {
          const payload = await readApiJson<{ error?: string }>(response, 'analytics_insights_export_failed').catch(() => null)
          throw new Error(payload?.error || 'analytics_insights_export_failed')
        }

        const blob = await response.blob()
        const filename = getFilenameFromResponse(response) || 'soflia-insights.pdf'
        downloadBlob(blob, filename)
      } catch (exportError) {
        setError(exportError instanceof Error ? exportError.message : 'analytics_insights_export_failed')
      } finally {
        setIsExportingInsightsPdf(false)
      }
    },
    [data, filters, orgSlug],
  )

  return {
    data,
    insights,
    filters,
    isLoading,
    isExporting,
    isGeneratingInsights,
    isExportingInsightsPdf,
    error,
    updateFilter,
    resetFilters,
    refetch: fetchAnalytics,
    exportAnalytics,
    generateInsights,
    exportInsightsPdf,
  }
}

function getDefaultFilters(): BusinessReportsAnalyticsClientFilters {
  const to = new Date()
  const from = new Date(to)
  from.setDate(from.getDate() - 365)

  return {
    from: toDateInputValue(from),
    to: toDateInputValue(to),
    granularity: 'month',
    courseId: '',
    gender: '',
    ageBand: '',
    jobTitle: '',
    role: '',
    status: '',
    regionId: '',
    zoneId: '',
    teamId: '',
  }
}

function buildQueryString(filters: BusinessReportsAnalyticsClientFilters): string {
  const params = new URLSearchParams()
  Object.entries(compactFilters(filters)).forEach(([key, value]) => {
    params.set(key, value)
  })
  return params.toString()
}

function compactFilters(filters: BusinessReportsAnalyticsClientFilters): Record<string, string> {
  return Object.entries(filters).reduce<Record<string, string>>((params, [key, value]) => {
    if (value) params[key] = value
    return params
  }, {})
}

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function getFilenameFromResponse(response: Response): string | null {
  const disposition = response.headers.get('Content-Disposition')
  const match = disposition?.match(/filename="([^"]+)"/)
  return match?.[1] || null
}

function getFallbackFilename(format: ReportsAnalyticsExportFormat): string {
  const extension = format === 'pdf' ? 'pdf' : format === 'xlsx' ? 'xlsx' : 'zip'
  return `soflia-analytics.${extension}`
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

async function readApiJson<T>(response: Response, fallbackMessage: string): Promise<T> {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return response.json() as Promise<T>
  }

  if (response.redirected || response.url.includes('/auth')) {
    throw new ApiJsonResponseError('Sesion expirada. Inicia sesion nuevamente.')
  }

  throw new ApiJsonResponseError(`${fallbackMessage}_${response.status}`)
}
