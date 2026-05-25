'use client'

import { motion } from 'framer-motion'
import { BarChart3, Star, Target, TrendingUp, Users2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useCourseManagementContext } from '../CourseManagementContext'

export function CourseStatsKpiGrid() {
  const { t } = useTranslation('admin')
  const {
    state: { userStats },
  } = useCourseManagementContext()

  const kpis = [
    {
      icon: Users2,
      label: t('workshops.editor.stats.enrolledStudents'),
      value: userStats?.total_enrolled ?? 0,
      change: '+12%',
      changeType: 'positive' as const,
      color: 'from-primary to-accent',
    },
    {
      icon: TrendingUp,
      label: t('workshops.editor.stats.completionRate'),
      value: userStats?.completion_rate ? `${userStats.completion_rate.toFixed(1)}%` : '0%',
      change: '+5.2%',
      changeType: 'positive' as const,
      color: 'from-success to-accent',
    },
    {
      icon: Target,
      label: t('workshops.editor.stats.averageProgress'),
      value: userStats ? `${Math.round(userStats.average_progress)}%` : '0%',
      change: '+8.1%',
      changeType: 'positive' as const,
      color: 'from-accent to-success',
    },
    {
      icon: Star,
      label: t('workshops.editor.stats.rating'),
      value: userStats?.average_rating ? userStats.average_rating.toFixed(1) : '0.0',
      change: userStats?.total_reviews 
        ? t('workshops.editor.stats.reviewsCount', { count: userStats.total_reviews }) 
        : t('workshops.editor.stats.noReviews'),
      changeType: 'neutral' as const,
      color: 'from-warning to-success',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
          <BarChart3 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-primary dark:text-white">{t('workshops.editor.stats.kpiTitle')}</h2>
          <p className="text-sm text-gray-500 dark:text-white/60">
            {t('workshops.editor.stats.kpiDescription')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon

          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group relative"
            >
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl dark:border-gray-500/30 dark:bg-carbon-800">
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${kpi.color} opacity-0 transition-opacity duration-300 group-hover:opacity-5`}
                />
                <div className="relative">
                  <div className="mb-4 flex items-center justify-between">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${kpi.color}`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    {kpi.changeType !== 'neutral' && (
                      <span className="rounded-full bg-success/10 px-2 py-1 text-xs font-semibold text-success">
                        {kpi.change}
                      </span>
                    )}
                  </div>
                  <div className="mb-1 text-3xl font-bold text-primary dark:text-white">
                    {kpi.value}
                  </div>
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-white/60">
                    {kpi.label}
                  </div>
                  {kpi.changeType === 'neutral' && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-white/60">
                      {kpi.change}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
