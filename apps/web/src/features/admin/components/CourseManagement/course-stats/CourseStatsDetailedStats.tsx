'use client'

import { motion } from 'framer-motion'
import { Award, BarChart3, Book, ClipboardList, Clock, FileText, Flag, Sigma, TrendingUp, Users2 } from 'lucide-react'

import { useCourseManagementContext } from '../CourseManagementContext'
import { formatDuration } from '../CourseManagement.utils'

export function CourseStatsDetailedStats() {
  const {
    state: { modules, userStats },
  } = useCourseManagementContext()

  const stats = [
    {
      label: 'Modulos Publicados',
      value: modules.filter((module) => module.is_published).length,
      total: modules.length,
      icon: Book,
      color: 'var(--color-primary)',
    },
    {
      label: 'Lecciones Totales',
      value: userStats?.total_lessons ?? 0,
      icon: FileText,
      color: 'var(--color-accent)',
    },
    {
      label: 'Duracion Total',
      value: formatDuration(
        modules.reduce((total, module) => total + (module.module_duration_minutes || 0), 0),
      ),
      icon: Clock,
      color: 'var(--color-success)',
    },
    {
      label: 'Materiales',
      value: userStats?.total_materials ?? 0,
      icon: ClipboardList,
      color: 'var(--color-warning)',
    },
    {
      label: 'Actividades',
      value: userStats?.total_activities ?? 0,
      icon: Flag,
      color: 'var(--color-primary)',
    },
    {
      label: 'Tasa de Retencion',
      value: userStats?.retention_rate ? `${userStats.retention_rate.toFixed(1)}%` : '0%',
      icon: Users2,
      color: 'var(--color-success)',
    },
    {
      label: 'Activos 7 dias',
      value: userStats?.active_7d ?? 0,
      icon: TrendingUp,
      color: 'var(--color-accent)',
    },
    {
      label: 'Activos 30 dias',
      value: userStats?.active_30d ?? 0,
      icon: BarChart3,
      color: 'var(--color-primary)',
    },
    {
      label: 'Certificados Emitidos',
      value: userStats?.total_certificates ?? 0,
      icon: Award,
      color: 'var(--color-warning)',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-success to-accent">
          <Sigma className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-primary dark:text-white">Analisis Detallado</h2>
          <p className="text-sm text-gray-500 dark:text-white/60">Metricas avanzadas del curso</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon

          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md dark:border-gray-500/30 dark:bg-carbon-800"
            >
              <div className="mb-3 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `color-mix(in srgb, ${stat.color} 8.2%, transparent)` }}
                >
                  <Icon className="h-5 w-5" style={{ color: stat.color }} />
                </div>
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-white/60">
                  {stat.label}
                </div>
              </div>
              <div className="text-2xl font-bold text-primary dark:text-white">
                {stat.value}
                {stat.total !== undefined && (
                  <span className="ml-2 text-sm font-normal text-gray-500 dark:text-white/60">
                    / {stat.total}
                  </span>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
