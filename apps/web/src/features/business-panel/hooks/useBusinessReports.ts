import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import type { ReportFilters, ReportType } from '../types/report-data.types'

export interface ReportData {
  report_type: ReportType
  filters: ReportFilters
  data: any
  generated_at: string
}

/**
 * Hook para obtener datos de reportes de la organización.
 *
 * IMPORTANTE: Este hook usa el orgSlug de la URL para asegurar
 * que se obtengan los datos de la organización correcta.
 */
export function useBusinessReports() {
  const params = useParams()
  const orgSlug = params?.orgSlug as string | undefined

  const [reportType, setReportType] = useState<ReportType>('users')
  const [filters, setFilters] = useState<Partial<ReportFilters>>({
    start_date: undefined,
    end_date: undefined,
    user_ids: undefined,
    course_ids: undefined,
    role: 'all',
    status: 'all'
  })
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchReport = useCallback(async (type?: ReportType, customFilters?: Partial<ReportFilters>) => {
    if (!orgSlug) {
      setError('No se pudo determinar la organización')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const typeToFetch = type || reportType
      const filtersToUse = { ...filters, ...customFilters }

      // Validar que el tipo de reporte sea válido
      if (!typeToFetch) {
        throw new Error('Tipo de reporte no especificado')
      }

      // Validar fechas si están presentes
      if (filtersToUse.start_date && filtersToUse.end_date) {
        const startDate = new Date(filtersToUse.start_date)
        const endDate = new Date(filtersToUse.end_date)
        if (startDate > endDate) {
          throw new Error('La fecha de inicio no puede ser posterior a la fecha de fin')
        }
      }

      const params = new URLSearchParams({
        type: typeToFetch
      })

      if (filtersToUse.start_date) {
        params.append('start_date', filtersToUse.start_date)
      }
      if (filtersToUse.end_date) {
        params.append('end_date', filtersToUse.end_date)
      }
      if (filtersToUse.user_ids?.length) {
        params.append('user_ids', filtersToUse.user_ids.join(','))
      }
      if (filtersToUse.course_ids?.length) {
        params.append('course_ids', filtersToUse.course_ids.join(','))
      }
      if (filtersToUse.role && filtersToUse.role !== 'all') {
        params.append('role', filtersToUse.role)
      }
      if (filtersToUse.status && filtersToUse.status !== 'all') {
        params.append('status', filtersToUse.status)
      }

      // Usar la API org-scoped
      const url = `/api/${orgSlug}/business/reports/data?${params.toString()}`

      const response = await fetch(url, {
        credentials: 'include'
      })

      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // Si no se puede parsear el JSON, usar el mensaje por defecto
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()

      if (data.success && data.data) {
        setReportData({
          report_type: data.report_type,
          filters: data.filters,
          data: data.data,
          generated_at: data.generated_at
        })
      } else {
        throw new Error(data.error || 'Error al obtener el reporte')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar el reporte'
      setError(errorMessage)
      console.error('Error fetching report:', err)
    } finally {
      setIsLoading(false)
    }
  }, [orgSlug, reportType, filters])

  const updateFilters = (newFilters: Partial<ReportFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const updateReportType = (type: ReportType) => {
    setReportType(type)
    setReportData(null) // Limpiar datos al cambiar tipo
  }

  const resetFilters = () => {
    setFilters({
      start_date: undefined,
      end_date: undefined,
      user_ids: undefined,
      course_ids: undefined,
      role: 'all',
      status: 'all'
    })
    setReportData(null)
  }

  return {
    reportType,
    setReportType: updateReportType,
    filters,
    setFilters: updateFilters,
    reportData,
    isLoading,
    error,
    fetchReport,
    resetFilters
  }
}
