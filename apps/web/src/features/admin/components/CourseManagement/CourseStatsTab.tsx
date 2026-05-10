'use client'

import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useCourseManagementContext } from './CourseManagementContext'
import { CourseStatsChartSections } from './course-stats/CourseStatsChartSections'
import { CourseStatsDetailedStats } from './course-stats/CourseStatsDetailedStats'
import { CourseStatsKpiGrid } from './course-stats/CourseStatsKpiGrid'
import { CourseStatsStudentsTable } from './course-stats/CourseStatsStudentsTable'

export function CourseStatsTab() {
  const { t } = useTranslation('admin')
  const {
    state: { statsLoading },
  } = useCourseManagementContext()

  return (
    <motion.div
      key="stats"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {statsLoading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="mb-4 h-16 w-16 rounded-full border-4 border-[#00D4B3]/20 border-t-[#00D4B3]"
          />
          <p className="text-sm font-medium text-[#6C757D] dark:text-white/60">
            {t('workshops.editor.stats.loading')}
          </p>
        </div>
      ) : (
        <>
          <CourseStatsKpiGrid />
          <CourseStatsChartSections />
          <CourseStatsDetailedStats />
          <CourseStatsStudentsTable />
        </>
      )}
    </motion.div>
  )
}
