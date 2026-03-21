'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  CheckCircle,
  Clock,
  TrendingUp,
  Award,
  AlertTriangle,
  BarChart3,
  Target
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { useThemeStore } from '@/core/stores/themeStore'

const ResponsiveBar = dynamic(() => import('@nivo/bar').then(mod => mod.ResponsiveBar), { ssr: false })
const ResponsivePie = dynamic(() => import('@nivo/pie').then(mod => mod.ResponsivePie), { ssr: false })

const COLORS = {
  primary: '#8b5cf6',
  secondary: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6'
}

interface CourseAnalyticsTabProps {
  courseId: string
  orgSlug: string
}

export function CourseAnalyticsTab({ courseId, orgSlug }: CourseAnalyticsTabProps) {
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'

  const nivoTheme = useMemo(() => ({
    background: 'transparent',
    text: {
      fontSize: 12,
      fill: isDark ? '#e5e7eb' : '#374151',
      outlineWidth: 0
    },
    axis: {
      domain: {
        line: {
          stroke: isDark ? '#4b5563' : '#cbd5e1',
          strokeWidth: 1
        }
      },
      ticks: {
        line: {
          stroke: isDark ? '#4b5563' : '#cbd5e1',
          strokeWidth: 1
        },
        text: {
          fontSize: 11,
          fill: isDark ? '#9ca3af' : '#64748b'
        }
      }
    },
    grid: {
      line: {
        stroke: isDark ? '#374151' : '#e2e8f0',
        strokeWidth: 1
      }
    },
    tooltip: {
      container: {
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#e5e7eb' : '#111827',
        fontSize: 12,
        borderRadius: '8px',
        padding: '8px 12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
      }
    }
  }), [isDark])

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
      
      const data = await response.json()

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
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <p className="text-red-400 text-lg mb-4">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-20">
        <p className="text-carbon-400">No hay datos disponibles</p>
      </div>
    )
  }

  const { stats, engagement, performance, progress_distribution, dropoff_analysis } = analyticsData

  // Datos para gráfica de distribución de progreso
  const progressData = progress_distribution.map((item: any) => ({
    id: item.range,
    label: item.range,
    value: item.count
  }))

  // Datos para gráfica de puntos de abandono
  const dropoffData = dropoff_analysis.dropoff_points.map((item: any) => ({
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
          color={COLORS.info}
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
          color={COLORS.primary}
        />
        <MetricCard
          icon={Target}
          label="Progreso Promedio"
          value={`${stats.average_progress}%`}
          color={COLORS.secondary}
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
          color={COLORS.info}
        />
        <MetricCard
          icon={TrendingUp}
          label="Tasa de Retención"
          value={`${engagement.retention_rate}%`}
          color={COLORS.primary}
        />
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución de Progreso */}
        <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Distribución de Progreso
          </h3>
          <div className="h-80">
            {progressData.length > 0 && progressData.some((d: any) => d.value > 0) ? (
              <ResponsivePie
                data={progressData}
                margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                innerRadius={0.5}
                padAngle={0.7}
                cornerRadius={3}
                activeOuterRadiusOffset={8}
                colors={[COLORS.success, COLORS.warning, COLORS.info, COLORS.secondary, COLORS.primary]}
                borderWidth={1}
                borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                arcLinkLabelsSkipAngle={10}
                arcLinkLabelsTextColor="#e5e7eb"
                arcLinkLabelsThickness={2}
                arcLinkLabelsColor={{ from: 'color' }}
                arcLabelsSkipAngle={10}
                arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                theme={nivoTheme}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-carbon-400">
                No hay datos de progreso disponibles
              </div>
            )}
          </div>
        </div>

        {/* Puntos de Abandono */}
        <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
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
              <div className="flex items-center justify-center h-full text-carbon-400">
                No se identificaron puntos de abandono
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resumen de Engagement y Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700">
          <h3 className="text-xl font-bold text-white mb-4">Engagement</h3>
          <div className="space-y-4">
            <StatRow label="Sesiones Totales" value={engagement.total_sessions.toString()} />
            <StatRow label="Duración Promedio de Sesión" value={`${engagement.average_session_duration} min`} />
            <StatRow label="Tasa de Retención" value={`${engagement.retention_rate}%`} />
            <StatRow label="Aprendices Activos (7 días)" value={engagement.active_learners.toString()} />
          </div>
        </div>

        <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700">
          <h3 className="text-xl font-bold text-white mb-4">Performance</h3>
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

function MetricCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: string, color: string }) {
  return (
    <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700">
      <div className="flex items-center justify-between mb-4">
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <p className="text-carbon-400 text-sm mb-2">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  )
}

function StatRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-carbon-700 last:border-0">
      <span className="text-carbon-300">{label}</span>
      <span className="text-white font-semibold">{value}</span>
    </div>
  )
}

