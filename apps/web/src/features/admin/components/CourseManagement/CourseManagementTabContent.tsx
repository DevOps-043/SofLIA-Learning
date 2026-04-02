'use client'

import { AnimatePresence } from 'framer-motion'

import { useCourseManagementContext } from './CourseManagementContext'
import { CourseConfigTab } from './CourseConfigTab'
import { CourseModulesTab } from './CourseModulesTab'
import { CoursePreviewTab } from './CoursePreviewTab'
import { CourseStatsTab } from './CourseStatsTab'

export function CourseManagementTabContent() {
  const {
    state: { activeTab },
  } = useCourseManagementContext()

  return (
    <>
      <AnimatePresence mode="wait">
        {activeTab === 'modules' && <CourseModulesTab key="modules" />}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {activeTab === 'config' && <CourseConfigTab key="config" />}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {activeTab === 'preview' && <CoursePreviewTab key="preview" />}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {activeTab === 'stats' && <CourseStatsTab key="stats" />}
      </AnimatePresence>
    </>
  )
}
