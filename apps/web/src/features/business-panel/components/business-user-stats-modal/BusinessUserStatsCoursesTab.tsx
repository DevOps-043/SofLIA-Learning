'use client'

import { motion } from 'framer-motion'
import { BookOpen } from 'lucide-react'
import { BusinessUserStatsEmptyState } from './shared'
import { BusinessUserStatsCourseBreakdownCard } from './BusinessUserStatsCourseBreakdownCard'
import type { BusinessUserStatsTabProps } from './types'

export function BusinessUserStatsCoursesTab({
  stats,
  t,
  theme,
  formatDate,
}: Pick<BusinessUserStatsTabProps, 'stats' | 't' | 'theme' | 'formatDate'>) {
  const courses = stats.courses_data ?? []

  if (courses.length === 0) {
    return (
      <BusinessUserStatsEmptyState
        icon={BookOpen}
        label={t('users.modals.stats.coursesList.empty')}
        theme={theme}
      />
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <h3
        className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em]"
        style={{ color: theme.mutedTextColor }}
      >
        <BookOpen className="h-4 w-4" style={{ color: theme.primaryColor }} />
        {t('users.modals.stats.coursesList.courseBreakdown')}
      </h3>

      <div className="space-y-6">
        {courses.map((course, index) => (
          <BusinessUserStatsCourseBreakdownCard
            key={course.course_id}
            course={course}
            delay={index * 0.08}
            formatDate={formatDate}
            t={t}
            theme={theme}
          />
        ))}
      </div>
    </motion.div>
  )
}
