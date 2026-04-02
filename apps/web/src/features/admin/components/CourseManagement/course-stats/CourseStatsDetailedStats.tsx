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
      color: '#0A2540',
    },
    {
      label: 'Lecciones Totales',
      value: userStats?.total_lessons ?? 0,
      icon: FileText,
      color: '#00D4B3',
    },
    {
      label: 'Duracion Total',
      value: formatDuration(
        modules.reduce((total, module) => total + (module.module_duration_minutes || 0), 0),
      ),
      icon: Clock,
      color: '#10B981',
    },
    {
      label: 'Materiales',
      value: userStats?.total_materials ?? 0,
      icon: ClipboardList,
      color: '#F59E0B',
    },
    {
      label: 'Actividades',
      value: userStats?.total_activities ?? 0,
      icon: Flag,
      color: '#0A2540',
    },
    {
      label: 'Tasa de Retencion',
      value: userStats?.retention_rate ? `${userStats.retention_rate.toFixed(1)}%` : '0%',
      icon: Users2,
      color: '#10B981',
    },
    {
      label: 'Activos 7 dias',
      value: userStats?.active_7d ?? 0,
      icon: TrendingUp,
      color: '#00D4B3',
    },
    {
      label: 'Activos 30 dias',
      value: userStats?.active_30d ?? 0,
      icon: BarChart3,
      color: '#0A2540',
    },
    {
      label: 'Certificados Emitidos',
      value: userStats?.total_certificates ?? 0,
      icon: Award,
      color: '#F59E0B',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#10B981] to-[#00D4B3]">
          <Sigma className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#0A2540] dark:text-white">Analisis Detallado</h2>
          <p className="text-sm text-[#6C757D] dark:text-white/60">Metricas avanzadas del curso</p>
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
              className="rounded-xl border border-[#E9ECEF] bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md dark:border-[#6C757D]/30 dark:bg-[#1E2329]"
            >
              <div className="mb-3 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <Icon className="h-5 w-5" style={{ color: stat.color }} />
                </div>
                <div className="text-xs font-semibold uppercase tracking-wide text-[#6C757D] dark:text-white/60">
                  {stat.label}
                </div>
              </div>
              <div className="text-2xl font-bold text-[#0A2540] dark:text-white">
                {stat.value}
                {stat.total !== undefined && (
                  <span className="ml-2 text-sm font-normal text-[#6C757D] dark:text-white/60">
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
