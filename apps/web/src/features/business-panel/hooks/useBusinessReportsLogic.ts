'use client'

import { useState, useCallback, useRef } from 'react'
import { Sparkles, Users, Activity, Award } from 'lucide-react'
import { useBusinessReports } from './useBusinessReports'
import { ReportType } from '@/app/api/[orgSlug]/business/reports/data/route'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { useThemeStore } from '@/core/stores/themeStore'
import { useTranslation } from 'react-i18next'

const getReportTypes = (accentColor: string, t: any) => [
  { value: 'lia-analysis' as ReportType, label: t('reports.types.liaAnalysis.label'), icon: Sparkles, description: t('reports.types.liaAnalysis.description'), color: '#0EA5E9' },
  { value: 'users' as ReportType, label: t('reports.types.users.label'), icon: Users, description: t('reports.types.users.description'), color: accentColor },
  { value: 'activity' as ReportType, label: t('reports.types.activity.label'), icon: Activity, description: t('reports.types.activity.description'), color: '#10b981' },
  { value: 'certificates' as ReportType, label: t('reports.types.certificates.label'), icon: Award, description: t('reports.types.certificates.description'), color: '#8b5cf6' }
]

const getChartColors = (accentColor: string) => [accentColor, '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']

export function useBusinessReportsLogic() {
  const { t } = useTranslation('business')
  const { styles } = useOrganizationStylesContext()
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'
  const panelStyles = styles?.panel
  const hasFetched = useRef(false)

  const cardBg = isDark ? (panelStyles?.card_background || 'rgba(30, 41, 59, 0.8)') : '#FFFFFF'
  const cardBorder = isDark ? (panelStyles?.border_color || 'rgba(51, 65, 85, 0.3)') : '#E2E8F0'
  const textColor = isDark ? (panelStyles?.text_color || '#f8fafc') : '#0F172A'
  const accentColor = panelStyles?.accent_color || '#00D4B3'
  const primaryColor = panelStyles?.primary_button_color || '#0A2540'
  const secondaryColor = panelStyles?.secondary_button_color || '#10b981'

  const REPORT_TYPES = getReportTypes(accentColor, t)
  const CHART_COLORS = getChartColors(accentColor)

  const {
    reportType,
    setReportType,
    filters,
    setFilters,
    reportData,
    isLoading,
    error,
    fetchReport,
    resetFilters
  } = useBusinessReports()

  const [showFilters, setShowFilters] = useState(false)
  const [localStartDate, setLocalStartDate] = useState('')
  const [localEndDate, setLocalEndDate] = useState('')

  const handleReportTypeChange = useCallback((type: ReportType) => {
    setReportType(type)
    hasFetched.current = false
  }, [setReportType])

  const handleGenerateReport = useCallback(() => {
    fetchReport(reportType, {
      ...filters,
      start_date: localStartDate || undefined,
      end_date: localEndDate || undefined
    })
    hasFetched.current = true
  }, [filters, localStartDate, localEndDate, fetchReport, reportType])

  // Auto-fetch when type changes (only if no fetch has been done)
  if (!hasFetched.current && reportType && !isLoading && !reportData) {
    fetchReport(reportType, filters)
    hasFetched.current = true
  }

  const handleExportExcel = async () => {
    if (!reportData?.data) {
      alert(t('reports.export.noData'))
      return
    }
    try {
      const XLSX = await import('xlsx')
      const workbook = XLSX.utils.book_new()
      let worksheet: any
      let filename = `reporte_${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`

      switch (reportType) {
        case 'users':
          worksheet = XLSX.utils.json_to_sheet(
            (reportData.data.users || []).map((u: any) => ({
              'Username': u.username,
              'Email': u.email,
              'Nombre': u.display_name,
              'Cargo': u.job_title || 'No especificado',
              'Estado': u.status,
              'Fecha de Ingreso': u.joined_at ? new Date(u.joined_at).toLocaleDateString('es-ES') : '',
              'Última Conexión': u.last_login_at ? new Date(u.last_login_at).toLocaleDateString('es-ES') : 'Nunca',
              'Total Cursos': u.progress?.total_courses || 0,
              'Cursos Completados': u.progress?.completed_courses || 0,
              'Progreso Promedio': `${u.progress?.average_progress?.toFixed(1) || 0}%`
            }))
          )
          break
        case 'activity':
          worksheet = XLSX.utils.json_to_sheet(
            (reportData.data.activities || []).map((a: any) => ({
              'Usuario': a.user_name || a.user_id,
              'Email': a.user_email || '',
              'Curso': a.course_title || a.course_id,
              'Estado': a.enrollment_status,
              'Fecha Inscripción': a.enrolled_at || '',
              'Último Acceso': a.last_accessed_at || ''
            }))
          )
          break
        case 'certificates':
          worksheet = XLSX.utils.json_to_sheet(
            (reportData.data.certificates || []).map((c: any) => ({
              'Usuario': c.user_name || c.user_id,
              'Email': c.user_email || '',
              'Curso': c.course_title || c.course_id,
              'Categoría': c.course_category || '',
              'Fecha Emisión': c.issued_at || ''
            }))
          )
          break
        case 'lia-analysis':
          // Exportar datos crudos para el análisis
          worksheet = XLSX.utils.json_to_sheet(
            (reportData.data.raw_data?.users?.users || []).map((u: any) => ({
              'Username': u.username,
              'Cargo': u.job_title,
              'Progreso': u.progress?.average_progress,
              'Ult. Conexión': u.last_login_at
            }))
          )
          break
        default:
          return
      }

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos')
      XLSX.writeFile(workbook, filename)
    } catch (err) {
      console.error('Error al exportar Excel:', err)
      alert(t('reports.export.error'))
    }
  }

  return {
    // Theme / styles
    isDark,
    cardBg,
    cardBorder,
    textColor,
    accentColor,
    primaryColor,
    secondaryColor,
    // Data
    REPORT_TYPES,
    CHART_COLORS,
    reportType,
    filters,
    setFilters,
    reportData,
    isLoading,
    error,
    resetFilters,
    // Filter UI state
    showFilters,
    setShowFilters,
    localStartDate,
    setLocalStartDate,
    localEndDate,
    setLocalEndDate,
    // Handlers
    handleReportTypeChange,
    handleGenerateReport,
    handleExportExcel,
  }
}
