'use client'

import { motion } from 'framer-motion'
import { Award, BookOpen, Clock, FileText, HelpCircle, MessageSquare } from 'lucide-react'
import {
  getBusinessUserStatsCourseProgressColor,
} from '../../services/business-user-stats-display.service'
import { BusinessUserStatsEmptyState } from './shared'
import type { BusinessUserStatsTabProps } from './types'

export function BusinessUserStatsCoursesTab({
  stats,
  t,
  theme,
  formatDate,
}: Pick<BusinessUserStatsTabProps, 'stats' | 't' | 'theme' | 'formatDate'>) {
  if (stats.courses_data.length === 0) {
    return (
      <BusinessUserStatsEmptyState
        icon={BookOpen}
        label={t('users.stats.coursesList.empty')}
        theme={theme}
      />
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {stats.courses_data.map((course, index) => {
        const progressColor = getBusinessUserStatsCourseProgressColor(course)

        return (
          <motion.div
            key={course.course_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative overflow-hidden rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-all duration-300"
          >
            <div className="p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white truncate mb-1">
                    {course.course_title}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-white/50">
                    {course.enrolled_at ? (
                      <span>
                        {t('users.stats.coursesList.enrolled')}: {formatDate(course.enrolled_at)}
                      </span>
                    ) : null}
                    {course.has_certificate ? (
                      <span className="flex items-center gap-1 text-amber-500 dark:text-amber-400">
                        <Award className="w-3 h-3" />
                        {t('users.stats.coursesList.certificate')}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: `${progressColor}20`, color: progressColor }}
                >
                  {course.status === 'completed'
                    ? `✓ ${t('users.stats.coursesList.completed')}`
                    : course.progress > 0
                      ? t('users.stats.coursesList.inProgress')
                      : t('users.stats.coursesList.notStarted')}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 dark:text-white/50">
                    {t('users.stats.coursesList.progress')}
                  </span>
                  <span className="text-sm font-bold" style={{ color: progressColor }}>
                    {course.progress}%
                  </span>
                </div>
                <div className="relative h-2 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${course.progress}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      backgroundColor: progressColor,
                      boxShadow: `0 0 10px ${progressColor}60`,
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <CourseMetric
                  icon={Clock}
                  label={t('users.stats.coursesList.time')}
                  value={
                    course.time_spent_minutes
                      ? `${Math.round((course.time_spent_minutes / 60) * 10) / 10}h`
                      : '0h'
                  }
                  color="text-amber-500 dark:text-amber-400"
                  bg="bg-amber-500/20"
                />
                <CourseMetric
                  icon={MessageSquare}
                  label={t('users.stats.coursesList.lia')}
                  value={course.lia_conversations_count || 0}
                  color="text-cyan-600 dark:text-cyan-400"
                  bg="bg-cyan-500/20"
                />
                <CourseMetric
                  icon={HelpCircle}
                  label={t('users.stats.coursesList.quiz')}
                  value={`${course.quiz_passed || 0}/${course.quiz_total || 0}`}
                  color="text-violet-600 dark:text-violet-400"
                  bg="bg-violet-500/20"
                />
                <CourseMetric
                  icon={FileText}
                  label={t('users.stats.coursesList.notes')}
                  value={course.notes_count || 0}
                  color="text-emerald-600 dark:text-emerald-400"
                  bg="bg-emerald-500/20"
                />
              </div>
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

function CourseMetric({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: typeof Clock
  label: string
  value: string | number
  color: string
  bg: string
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-100 dark:bg-white/5">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bg}`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div>
        <div className="text-sm font-semibold text-gray-900 dark:text-white">{value}</div>
        <div className="text-xs text-gray-500 dark:text-white/40">{label}</div>
      </div>
    </div>
  )
}
