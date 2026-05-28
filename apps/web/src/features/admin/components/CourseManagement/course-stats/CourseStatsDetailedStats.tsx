'use client'

import { motion } from 'framer-motion'
import { Award, BarChart3, Book, ClipboardList, Clock, FileText, Flag, Sigma, TrendingUp, Users2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useCourseManagementContext } from '../CourseManagementContext'
import { formatDuration } from '../CourseManagement.utils'

export function CourseStatsDetailedStats() {
  const { t } = useTranslation('admin')
  const {
    state: { modules, userStats },
  } = useCourseManagementContext()

  const stats = [
    {
      label: t('workshops.editor.stats.details.publishedModules'),
      value: modules.filter((module) => module.is_published).length,
      total: modules.length,
      icon: Book,
      color: 'var(--color-primary)',
    },
    {
      label: t('workshops.editor.stats.details.totalLessons'),
      value: userStats?.total_lessons ?? 0,
      icon: FileText,
      color: 'var(--color-accent)',
    },
    {
      label: t('workshops.editor.stats.details.totalDuration'),
      value: formatDuration(
        modules.reduce((total, module) => total + (module.module_duration_minutes || 0), 0),
      ),
      icon: Clock,
      color: 'var(--color-success)',
    },
    {
      label: t('workshops.editor.stats.details.materials'),
      value: userStats?.total_materials ?? 0,
      icon: ClipboardList,
      color: 'var(--color-warning)',
    },
    {
      label: t('workshops.editor.stats.details.activities'),
      value: userStats?.total_activities ?? 0,
      icon: Flag,
      color: 'var(--color-primary)',
    },
    {
      label: t('workshops.editor.stats.details.retentionRate'),
      value: userStats?.retention_rate ? `${userStats.retention_rate.toFixed(1)}%` : '0%',
      icon: Users2,
      color: 'var(--color-success)',
    },
    {
      label: t('workshops.editor.stats.details.active7d'),
      value: userStats?.active_7d ?? 0,
      icon: TrendingUp,
      color: 'var(--color-accent)',
    },
    {
      label: t('workshops.editor.stats.details.active30d'),
      value: userStats?.active_30d ?? 0,
      icon: BarChart3,
      color: 'var(--color-primary)',
    },
    {
      label: t('workshops.editor.stats.details.certificatesIssued'),
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
          <h2 className="text-2xl font-bold text-primary dark:text-white">
            {t('workshops.editor.stats.details.title')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-white/60">
            {t('workshops.editor.stats.details.description')}
          </p>
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
