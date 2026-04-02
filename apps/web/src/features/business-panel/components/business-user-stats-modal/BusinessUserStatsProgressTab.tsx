'use client'

import { motion } from 'framer-motion'
import { BookOpen, CheckCircle, HelpCircle, Layers, TrendingUp } from 'lucide-react'
import {
  getBusinessUserStatsCourseProgressColor,
} from '../../services/business-user-stats-display.service'
import { BusinessUserStatsEmptyState } from './shared'
import type { BusinessUserStatsTabProps } from './types'

export function BusinessUserStatsProgressTab({
  stats,
  t,
  theme,
  formatDate,
}: Pick<BusinessUserStatsTabProps, 'stats' | 't' | 'theme' | 'formatDate'>) {
  if (stats.courses_data.length === 0) {
    return (
      <BusinessUserStatsEmptyState
        icon={TrendingUp}
        label={t('users.stats.timeline.empty')}
        theme={theme}
      />
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {stats.courses_data.map((course, index) => {
        const progressColor = getBusinessUserStatsCourseProgressColor(course)

        return (
          <motion.div
            key={course.course_id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.15 }}
            className="relative"
          >
            {index < stats.courses_data.length - 1 ? (
              <div
                className="absolute left-6 top-16 bottom-0 w-0.5"
                style={{
                  background: theme.isDark
                    ? 'linear-gradient(to bottom, rgba(255, 255, 255, 0.3), transparent)'
                    : 'linear-gradient(to bottom, rgba(0, 0, 0, 0.2), transparent)',
                }}
              />
            ) : null}

            <div className="flex gap-4">
              <div className="flex-shrink-0 relative">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold border"
                  style={{
                    backgroundColor: theme.isDark
                      ? `${progressColor}30`
                      : `${progressColor}20`,
                    color: progressColor,
                    borderColor: theme.isDark ? `${progressColor}50` : `${progressColor}30`,
                  }}
                >
                  {course.progress}%
                </div>
              </div>

              <div className="flex-1 pb-6">
                <div
                  className="rounded-2xl border p-4"
                  style={{
                    background: theme.isDark
                      ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))'
                      : '#E9ECEF',
                    borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.15)' : '#6C757D',
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-base font-semibold mb-1 text-gray-900 dark:text-white">
                        {course.course_title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-white/50">
                        {course.status === 'completed'
                          ? `${t('users.stats.coursesList.completed')} ${formatDate(course.completed_at)}`
                          : course.progress > 0
                            ? t('users.stats.coursesList.inProgress')
                            : t('users.stats.coursesList.notStarted')}
                      </p>
                    </div>
                    {course.status === 'completed' ? (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: theme.isDark
                            ? 'rgba(16, 185, 129, 0.3)'
                            : 'rgba(16, 185, 129, 0.2)',
                        }}
                      >
                        <CheckCircle
                          className="w-5 h-5"
                          style={{ color: theme.isDark ? '#10B981' : '#059669' }}
                        />
                      </div>
                    ) : null}
                  </div>

                  <div
                    className="relative h-3 rounded-full overflow-hidden mb-4"
                    style={{
                      backgroundColor: theme.isDark
                        ? 'rgba(255, 255, 255, 0.15)'
                        : 'rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${course.progress}%` }}
                      transition={{ duration: 1, delay: index * 0.15 }}
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${progressColor}, ${progressColor}CC)`,
                        boxShadow: `0 0 15px ${progressColor}50`,
                      }}
                    />
                  </div>

                  <div className="flex flex-wrap gap-4">
                    {course.modules_total && course.modules_total > 0 ? (
                      <TimelineMetric
                        icon={Layers}
                        value={`${course.modules_completed || 0}/${course.modules_total}`}
                        label={t('users.stats.timeline.modules')}
                        color={theme.isDark ? '#60A5FA' : '#3B82F6'}
                      />
                    ) : null}
                    {course.lessons_total && course.lessons_total > 0 ? (
                      <TimelineMetric
                        icon={BookOpen}
                        value={`${course.lessons_completed || 0}/${course.lessons_total}`}
                        label={t('users.stats.timeline.lessons')}
                        color={theme.isDark ? '#A78BFA' : '#8B5CF6'}
                      />
                    ) : null}
                    {course.quiz_total && course.quiz_total > 0 ? (
                      <TimelineMetric
                        icon={HelpCircle}
                        value={`${course.quiz_passed || 0}/${course.quiz_total}`}
                        label={t('users.stats.timeline.quizzes')}
                        color={theme.isDark ? '#FBBF24' : '#F59E0B'}
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

function TimelineMetric({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: typeof Layers
  value: string
  label: string
  color: string
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4" style={{ color }} />
      <span className="text-sm text-gray-600 dark:text-white/80">
        <span className="font-semibold text-gray-900 dark:text-white">{value}</span> {label}
      </span>
    </div>
  )
}
