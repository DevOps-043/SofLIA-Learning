'use client'

import { useState, useCallback, useRef } from 'react'
import { Sparkles, Users, Activity, Award } from 'lucide-react'
import type { TFunction } from 'i18next'
import type { WorkSheet } from 'xlsx'
import { useBusinessReports } from './useBusinessReports'
import type { ReportType } from '../types/report-data.types'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { useThemeStore } from '../../../core/stores/themeStore'
import { useTranslation } from 'react-i18next'

interface UsersExportReport {
  users?: Array<{
    username?: string | null
    email?: string | null
    display_name?: string | null
    job_title?: string | null
    status?: string | null
    joined_at?: string | null
    last_login_at?: string | null
    progress?: {
      total_courses?: number
      completed_courses?: number
      average_progress?: number
    }
  }>
}

interface ActivityExportReport {
  activities?: Array<{
    user_name?: string | null
    user_id?: string | null
    user_email?: string | null
    course_title?: string | null
    course_id?: string | null
    enrollment_status?: string | null
    enrolled_at?: string | null
    last_accessed_at?: string | null
  }>
}

interface CertificatesExportReport {
  certificates?: Array<{
    user_name?: string | null
    user_id?: string | null
    user_email?: string | null
    course_title?: string | null
    course_id?: string | null
    course_category?: string | null
    issued_at?: string | null
  }>
}

interface LiaAnalysisExportReport {
  raw_data?: {
    users?: {
      users?: Array<{
        username?: string | null
        job_title?: string | null
        last_login_at?: string | null
        progress?: {
          average_progress?: number
        }
      }>
    }
  }
}

const getReportTypes = (accentColor: string, t: TFunction<'business'>) => [
  { value: 'lia-analysis' as ReportType, label: t('reports.types.liaAnalysis.label'), icon: Sparkles, description: t('reports.types.liaAnalysis.description'), color: '#0EA5E9' },
  { value: 'users' as ReportType, label: t('reports.types.users.label'), icon: Users, description: t('reports.types.users.description'), color: accentColor },
  { value: 'activity' as ReportType, label: t('reports.types.activity.label'), icon: Activity, description: t('reports.types.activity.description'), color: '#10b981' },
  { value: 'certificates' as ReportType, label: t('reports.types.certificates.label'), icon: Award, description: t('reports.types.certificates.description'), color: '#8b5cf6' },
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
    resetFilters,
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
      end_date: localEndDate || undefined,
    })
    hasFetched.current = true
  }, [filters, localStartDate, localEndDate, fetchReport, reportType])

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
      let worksheet: WorkSheet | null = null
      const filename = `reporte_${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`

      switch (reportType) {
        case 'users': {
          const usersReport = reportData.data as UsersExportReport
          worksheet = XLSX.utils.json_to_sheet(
            (usersReport.users || []).map((user) => ({
              Username: user.username,
              Email: user.email,
              Nombre: user.display_name,
              Cargo: user.job_title || 'No especificado',
              Estado: user.status,
              'Fecha de Ingreso': user.joined_at ? new Date(user.joined_at).toLocaleDateString('es-ES') : '',
              'Ultima Conexion': user.last_login_at ? new Date(user.last_login_at).toLocaleDateString('es-ES') : 'Nunca',
              'Total Cursos': user.progress?.total_courses || 0,
              'Cursos Completados': user.progress?.completed_courses || 0,
              'Progreso Promedio': `${user.progress?.average_progress?.toFixed(1) || 0}%`,
            })),
          )
          break
        }
        case 'activity': {
          const activityReport = reportData.data as ActivityExportReport
          worksheet = XLSX.utils.json_to_sheet(
            (activityReport.activities || []).map((activity) => ({
              Usuario: activity.user_name || activity.user_id,
              Email: activity.user_email || '',
              Curso: activity.course_title || activity.course_id,
              Estado: activity.enrollment_status,
              'Fecha Inscripcion': activity.enrolled_at || '',
              'Ultimo Acceso': activity.last_accessed_at || '',
            })),
          )
          break
        }
        case 'certificates': {
          const certificatesReport = reportData.data as CertificatesExportReport
          worksheet = XLSX.utils.json_to_sheet(
            (certificatesReport.certificates || []).map((certificate) => ({
              Usuario: certificate.user_name || certificate.user_id,
              Email: certificate.user_email || '',
              Curso: certificate.course_title || certificate.course_id,
              Categoria: certificate.course_category || '',
              'Fecha Emision': certificate.issued_at || '',
            })),
          )
          break
        }
        case 'lia-analysis': {
          const liaReport = reportData.data as LiaAnalysisExportReport
          worksheet = XLSX.utils.json_to_sheet(
            (liaReport.raw_data?.users?.users || []).map((user) => ({
              Username: user.username,
              Cargo: user.job_title,
              Progreso: user.progress?.average_progress,
              'Ult. Conexion': user.last_login_at,
            })),
          )
          break
        }
        default:
          return
      }

      if (!worksheet) {
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
    isDark,
    cardBg,
    cardBorder,
    textColor,
    accentColor,
    primaryColor,
    secondaryColor,
    REPORT_TYPES,
    CHART_COLORS,
    reportType,
    filters,
    setFilters,
    reportData,
    isLoading,
    error,
    resetFilters,
    showFilters,
    setShowFilters,
    localStartDate,
    setLocalStartDate,
    localEndDate,
    setLocalEndDate,
    handleReportTypeChange,
    handleGenerateReport,
    handleExportExcel,
  }
}
