import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import type {
  BusinessAnalyticsCourseMetric as CourseMetrics,
  BusinessAnalyticsData as AnalyticsData,
  BusinessAnalyticsGeneralMetrics as GeneralMetrics,
  BusinessAnalyticsRoleDistribution as RoleData,
  BusinessAnalyticsTeam as TeamAnalytics,
  BusinessAnalyticsTeamsData as TeamsData,
  BusinessAnalyticsTrendData as TrendData,
  BusinessAnalyticsUser as UserAnalytics,
} from '../types/analytics.types'

export type {
  AnalyticsData,
  CourseMetrics,
  GeneralMetrics,
  RoleData,
  TeamAnalytics,
  TeamsData,
  TrendData,
  UserAnalytics,
}

/**
 * Hook para obtener datos de analytics de la organización.
 *
 * IMPORTANTE: Este hook usa el orgSlug de la URL para asegurar
 * que se obtengan los datos de la organización correcta.
 */
export function useBusinessAnalytics() {
  const params = useParams()
  const orgSlug = params?.orgSlug as string | undefined

  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async () => {
    if (!orgSlug) {
      setError('No se pudo determinar la organización')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Usar la API org-scoped
      const response = await fetch(`/api/${orgSlug}/business/analytics`, {
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || errorData.message || `Error ${response.status}: ${response.statusText}`

        if (response.status === 401 || response.status === 403) {
          throw new Error(errorMessage)
        }

        throw new Error(errorMessage)
      }

      const result = await response.json()

      if (result.success && result.general_metrics) {
        setData({
          general_metrics: result.general_metrics,
          user_analytics: result.user_analytics || [],
          trends: result.trends || {
            enrollments_by_month: [],
            completions_by_month: [],
            time_by_month: [],
            active_users_by_month: []
          },
          by_role: result.by_role || {
            distribution: [],
            progress_comparison: [],
            completions: [],
            time_spent: []
          },
          course_metrics: result.course_metrics || {
            distribution: [],
            top_by_time: []
          },
          teams: result.teams || {
            total_teams: 0,
            teams: [],
            ranking: []
          },
          study_planner: result.study_planner,
          engagement_metrics: result.engagement_metrics || {
            stickiness: [],
            frequency: [],
            streaks: [],
            heatmap: [],
            duration: []
          }
        })
      } else {
        throw new Error(result.error || 'Error al obtener datos de analytics')
      }
    } catch (err) {
      let errorMessage = 'Error desconocido al cargar analytics'

      if (err instanceof Error) {
        errorMessage = err.message

        if (err.message.includes('401') || err.message.includes('No autenticado') || err.message.includes('Sesión')) {
          errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.'
        } else if (err.message.includes('403') || err.message.includes('Permisos insuficientes')) {
          errorMessage = 'No tienes permisos para acceder a esta información.'
        }
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [orgSlug])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  return {
    data,
    isLoading,
    error,
    refetch: fetchAnalytics
  }
}
