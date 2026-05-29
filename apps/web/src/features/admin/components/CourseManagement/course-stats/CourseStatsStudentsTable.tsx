'use client'

import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ResponsiveDataTable } from '@/core/layout'
import { useCourseManagementContext } from '../CourseManagementContext'
import { MobileStudentCard } from './course-stats-students-table/MobileStudentCard'
import { StudentsEmptyState, StudentsTableHeader } from './course-stats-students-table/TableStates'
import { buildCourseStatsStudentsColumns } from './course-stats-students-table/table-columns'
import type { CourseStatsStudentRow } from './course-stats-students-table/types'

export function CourseStatsStudentsTable() {
  const { i18n, t } = useTranslation('admin')
  const {
    state: {
      enrolledUsers,
      loadStudentDetails,
      setSelectedStudent,
      setShowStudentDetailsModal,
    },
  } = useCourseManagementContext()

  const handleOpenDetails = async (user: CourseStatsStudentRow) => {
    setSelectedStudent(user)
    setShowStudentDetailsModal(true)
    await loadStudentDetails(user.user_id)
  }

  const locale = i18n.language === 'en' ? 'en-US' : i18n.language === 'pt' ? 'pt-BR' : 'es-ES'
  const tableLabels = {
    actions: t('workshops.editor.stats.studentsTable.actions'),
    enrolledAt: t('workshops.editor.stats.studentsTable.enrolledAt'),
    lastActivity: t('workshops.editor.stats.studentsTable.lastActivity'),
    never: t('workshops.editor.stats.studentDetails.activity.never'),
    progress: t('workshops.editor.stats.studentsTable.progress'),
    status: t('workshops.editor.stats.studentsTable.status'),
    student: t('workshops.editor.stats.studentsTable.student'),
  }
  const columns = buildCourseStatsStudentsColumns(
    (user) => {
      void handleOpenDetails(user)
    },
    tableLabels,
    locale,
  )

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 20 }}
      transition={{ delay: 0.8 }}
    >
      <StudentsTableHeader total={enrolledUsers.length} />

      {enrolledUsers.length === 0 ? (
        <StudentsEmptyState />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-500/30 dark:bg-carbon-800">
          <ResponsiveDataTable
            columns={columns}
            data={enrolledUsers}
            keyExtractor={(user) => user.enrollment_id}
            mobileListClassName="p-3"
            renderMobileCard={(user) => (
              <MobileStudentCard
                labels={tableLabels}
                locale={locale}
                onOpenDetails={(selectedUser) => {
                  void handleOpenDetails(selectedUser)
                }}
                user={user}
              />
            )}
            tableClassName="w-full"
          />
        </div>
      )}
    </motion.div>
  )
}
