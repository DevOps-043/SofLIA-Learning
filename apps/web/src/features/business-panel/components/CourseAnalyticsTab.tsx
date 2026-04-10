'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ResponsiveBar } from '@nivo/bar'
import { ResponsivePie } from '@nivo/pie'
import {
  Users,
  CheckCircle,
  Clock,
  TrendingUp,
  Award,
  AlertTriangle,
  BarChart3,
  Target,
  type LucideIcon
} from 'lucide-react'
import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme'
import { BusinessPanelStatCard } from './shared/BusinessPanelStatCard'

interface CourseAnalyticsTabProps {
  courseId: string
  orgSlug: string
}

interface CourseAnalyticsStats {
  total_assigned: number
  completed: number
  completion_rate: number
  average_progress: number
  average_time_minutes: number
}

interface CourseAnalyticsEngagement {
  active_learners: number
  retention_rate: number
  total_sessions: number
  average_session_duration: number
}

interface CourseAnalyticsPerformance {
  average_rating: number
  total_reviews: number
  average_completion_time_days: number
}

interface ProgressDistributionItem {
  range: string
  count: number
}

interface DropoffPoint {
  lesson_title: string
  dropoff_count: number
}

interface DropoffAnalysis {
  average_dropoff_percentage: number
  dropoff_points: DropoffPoint[]
}

interface CourseAnalyticsResponse {
  success?: boolean
  error?: string
  stats: CourseAnalyticsStats
  engagement: CourseAnalyticsEngagement
  performance: CourseAnalyticsPerformance
  progress_distribution: ProgressDistributionItem[]
  dropoff_analysis: DropoffAnalysis
}

export function CourseAnalyticsTab({ courseId, orgSlug }: CourseAnalyticsTabProps) {
  const [analyticsData, setAnalyticsData] = useState<CourseAnalyticsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const panelTheme = useBusinessPanelTheme()
  const isDark = panelTheme.isDark

  const nivoTheme = useMemo(() => ({
    background: 'transparent',
    text: {
      fontSize: 12,
      fill: panelTheme.subtextColor,
      outlineWidth: 0
    },
    axis: {
      domain: {
        line: {
          stroke: panelTheme.dividerColor,
          strokeWidth: 1
        }
      },
      ticks: {
        line: {
          stroke: panelTheme.dividerColor,
          strokeWidth: 1
        },
        text: {
          fontSize: 11,
          fill: panelTheme.subtextColor
        }
      }
    },
    grid: {
      line: {
        stroke: panelTheme.dividerColor,
        strokeWidth: 1
      }
    },
    tooltip: {
      container: {
        background: panelTheme.panelBg,
        color: panelTheme.textColor,
        fontSize: 12,
        borderRadius: '12px',
        padding: '8px 12px',
        boxShadow: '0 12px 28px rgba(0,0,0,0.18)',
        border: `1px solid ${panelTheme.borderColor}`
      }
    }
  }), [isDark, panelTheme.borderColor, panelTheme.dividerColor, panelTheme.panelBg, panelTheme.subtextColor, panelTheme.textColor])

  const COLORS = {
    action: panelTheme.actionColor,
    brand: panelTheme.brandColor,
    accent: panelTheme.accentColor,
    success: panelTheme.successColor,
    warning: panelTheme.warningColor,
    danger: panelTheme.dangerColor,
  }

  const surfaceStyle = {
    backgroundColor: panelTheme.cardBg,
    borderColor: panelTheme.borderColor,
  }

  useEffect(() => {
    fetchAnalytics()
  }, [courseId])

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/${orgSlug}/business/courses/${courseId}/analytics`, {
        credentials: 'include'
      })
      
      const data = await response.json() as CourseAnalyticsResponse

      if (data.success) {
        setAnalyticsData(data)
      } else {
        setError(data.error || 'Error al obtener analytics del curso')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar analytics')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className="w-16 h-16 border-4 rounded-full animate-spin"
          style={{
            borderColor: `${panelTheme.actionColor}30`,
            borderTopColor: panelTheme.actionColor,
          }}
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="w-16 h-16 mx-auto mb-4" style={{ color: panelTheme.dangerColor }} />
        <p className="text-lg mb-4" style={{ color: panelTheme.dangerColor }}>{error}</p>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 rounded-lg transition-colors"
          style={{
            backgroundColor: panelTheme.actionSurface,
            color: panelTheme.actionColor,
            border: `1px solid ${panelTheme.borderColor}`,
          }}
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-20">
        <p style={{ color: panelTheme.subtextColor }}>No hay datos disponibles</p>
      </div>
    )
  }

  const { stats, engagement, performance, progress_distribution, dropoff_analysis } = analyticsData

  // Datos para gráfica de distribución de progreso
  const progressData = progress_distribution.map((item) => ({
    id: item.range,
    label: item.range,
    value: item.count
  }))

  // Datos para gráfica de puntos de abandono
  const dropoffData = dropoff_analysis.dropoff_points.map((item) => ({
    lesson: item.lesson_title.substring(0, 30) + (item.lesson_title.length > 30 ? '...' : ''),
    count: item.dropoff_count
  }))

  return (
    <motion.div
      key="analytics"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* Cards de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          icon={Users}
          label="Total Asignados"
          value={stats.total_assigned.toString()}
          color={COLORS.action}
        />
        <MetricCard
          icon={CheckCircle}
          label="Completados"
          value={stats.completed.toString()}
          color={COLORS.success}
        />
        <MetricCard
          icon={TrendingUp}
          label="Tasa de Completación"
          value={`${stats.completion_rate}%`}
          color={COLORS.brand}
        />
        <MetricCard
          icon={Target}
          label="Progreso Promedio"
          value={`${stats.average_progress}%`}
          color={COLORS.accent}
        />
      </div>

      {/* Segunda fila de cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          icon={Clock}
          label="Tiempo Promedio"
          value={`${Math.round(stats.average_time_minutes / 60)}h ${stats.average_time_minutes % 60}m`}
          color={COLORS.warning}
        />
        <MetricCard
          icon={Award}
          label="Rating Promedio"
          value={performance.average_rating > 0 ? performance.average_rating.toFixed(1) : 'N/A'}
          color={COLORS.success}
        />
        <MetricCard
          icon={Users}
          label="Aprendices Activos"
          value={engagement.active_learners.toString()}
          color={COLORS.action}
        />
        <MetricCard
          icon={TrendingUp}
          label="Tasa de Retención"
          value={`${engagement.retention_rate}%`}
          color={COLORS.brand}
        />
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución de Progreso */}
        <div className="rounded-3xl p-6 border" style={surfaceStyle}>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: panelTheme.textColor }}>
            <BarChart3 className="w-5 h-5" style={{ color: COLORS.action }} />
            Distribución de Progreso
          </h3>
          <div className="h-80">
            {progressData.length > 0 && progressData.some((distribution) => distribution.value > 0) ? (
              <ResponsivePie
                data={progressData}
                margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                innerRadius={0.5}
                padAngle={0.7}
                cornerRadius={3}
                activeOuterRadiusOffset={8}
                colors={[COLORS.success, COLORS.warning, COLORS.brand, COLORS.accent, COLORS.action]}
                borderWidth={1}
                borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                arcLinkLabelsSkipAngle={10}
                arcLinkLabelsTextColor={panelTheme.subtextColor}
                arcLinkLabelsThickness={2}
                arcLinkLabelsColor={{ from: 'color' }}
                arcLabelsSkipAngle={10}
                arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                theme={nivoTheme}
              />
            ) : (
              <div className="flex items-center justify-center h-full" style={{ color: panelTheme.subtextColor }}>
                No hay datos de progreso disponibles
              </div>
            )}
          </div>
        </div>

        {/* Puntos de Abandono */}
        <div className="rounded-3xl p-6 border" style={surfaceStyle}>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: panelTheme.textColor }}>
            <AlertTriangle className="w-5 h-5" style={{ color: COLORS.warning }} />
            Puntos de Abandono
          </h3>
          <div className="h-80">
            {dropoffData.length > 0 ? (
              <ResponsiveBar
                data={dropoffData}
                keys={['count']}
                indexBy="lesson"
                margin={{ top: 50, right: 50, bottom: 120, left: 60 }}
                padding={0.3}
                valueScale={{ type: 'linear' }}
                indexScale={{ type: 'band', round: true }}
                colors={COLORS.warning}
                borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -45,
                  legend: 'Lección',
                  legendPosition: 'middle',
                  legendOffset: 100
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Usuarios',
                  legendPosition: 'middle',
                  legendOffset: -40
                }}
                labelSkipWidth={12}
                labelSkipHeight={12}
                labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                theme={nivoTheme}
              />
            ) : (
              <div className="flex items-center justify-center h-full" style={{ color: panelTheme.subtextColor }}>
                No se identificaron puntos de abandono
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resumen de Engagement y Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-3xl p-6 border" style={surfaceStyle}>
          <h3 className="text-xl font-bold mb-4" style={{ color: panelTheme.textColor }}>Engagement</h3>
          <div className="space-y-4">
            <StatRow label="Sesiones Totales" value={engagement.total_sessions.toString()} />
            <StatRow label="Duración Promedio de Sesión" value={`${engagement.average_session_duration} min`} />
            <StatRow label="Tasa de Retención" value={`${engagement.retention_rate}%`} />
            <StatRow label="Aprendices Activos (7 días)" value={engagement.active_learners.toString()} />
          </div>
        </div>

        <div className="rounded-3xl p-6 border" style={surfaceStyle}>
          <h3 className="text-xl font-bold mb-4" style={{ color: panelTheme.textColor }}>Performance</h3>
          <div className="space-y-4">
            <StatRow label="Rating Promedio" value={performance.average_rating > 0 ? performance.average_rating.toFixed(1) : 'N/A'} />
            <StatRow label="Total Reseñas" value={performance.total_reviews.toString()} />
            <StatRow label="Tiempo Promedio de Completación" value={`${performance.average_completion_time_days} días`} />
            <StatRow label="Tasa de Abandono Promedio" value={`${dropoff_analysis.average_dropoff_percentage}%`} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function MetricCard({ icon: Icon, label, value, color }: { icon: LucideIcon, label: string, value: string, color: string }) {
  return (
    <BusinessPanelStatCard
      icon={<Icon className="w-5 h-5" />}
      title={label}
      value={value}
      iconColor={color}
    />
  )
}

function StatRow({ label, value }: { label: string, value: string }) {
  const panelTheme = useBusinessPanelTheme()

  return (
    <div className="flex items-center justify-between py-2 last:border-0" style={{ borderBottom: `1px solid ${panelTheme.dividerColor}` }}>
      <span style={{ color: panelTheme.subtextColor }}>{label}</span>
      <span className="font-semibold" style={{ color: panelTheme.textColor }}>{value}</span>
    </div>
  )
}
