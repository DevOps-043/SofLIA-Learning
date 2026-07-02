'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Route } from 'lucide-react'
import { ToastNotification } from '@/core/components/ToastNotification/ToastNotification'
import { useCourseSectionLogic } from './useCourseSectionLogic'
import { UnifiedOrgGrid, UnifiedUserAssignmentsTable } from './CoursesList'
import {
  CoursesHeader,
  CoursesSearchBar,
  CatalogModal,
  LearningPathCatalogModal,
  AssignUserModal,
} from './CoursesFilters'
import { colors } from './courses-section.types'
import { ContentDefaultModal } from './ContentDefaultModal'

interface CoursesSectionProps {
  companyId: string
}

function StatsRow({ courseCount, pathCount }: { courseCount: number; pathCount: number }) {
  return (
    <div className="flex gap-3 flex-wrap">
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/[0.02]">
        <BookOpen className="w-3.5 h-3.5" style={{ color: colors.accent }} />
        <span className="text-xs font-bold text-gray-600 dark:text-white/60">
          {courseCount} {courseCount === 1 ? 'Curso' : 'Cursos'}
        </span>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/[0.02]">
        <Route className="w-3.5 h-3.5" style={{ color: colors.purple }} />
        <span className="text-xs font-bold text-gray-600 dark:text-white/60">
          {pathCount} {pathCount === 1 ? 'Ruta' : 'Rutas'}
        </span>
      </div>
    </div>
  )
}

export const CoursesSection: React.FC<CoursesSectionProps> = ({ companyId }) => {
  const logic = useCourseSectionLogic({ companyId })

  if (logic.loading) {
    return (
      <div className="rounded-2xl p-6 flex flex-col items-center justify-center py-20 space-y-4 border border-gray-100 bg-white dark:border-white/5 dark:bg-carbon-800">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-4 rounded-full"
          style={{
            borderTopColor: colors.accent,
            borderRightColor: `color-mix(in srgb, ${colors.accent} 12.5%, transparent)`,
            borderBottomColor: `color-mix(in srgb, ${colors.accent} 12.5%, transparent)`,
            borderLeftColor: `color-mix(in srgb, ${colors.accent} 12.5%, transparent)`,
          }}
        />
        <p className="text-sm font-medium text-gray-500 dark:text-white/60">Preparando catálogo...</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl p-6 space-y-6 border border-gray-100 bg-white dark:border-white/5 dark:bg-carbon-800">
      <ToastNotification
        isOpen={logic.toast.isOpen}
        onClose={() => logic.setToast(prev => ({ ...prev, isOpen: false }))}
        message={logic.toast.message}
        type={logic.toast.type}
      />

      <CoursesHeader
        activeTab={logic.activeTab}
        setActiveTab={logic.setActiveTab}
        contentTypeFilter={logic.contentTypeFilter}
        setContentTypeFilter={logic.setContentTypeFilter}
        onOpenCatalog={() => logic.setIsCatalogOpen(true)}
        onOpenLearningPathCatalog={() => logic.setIsLearningPathCatalogOpen(true)}
        onAssignUser={() => logic.setIsAssignUserModalOpen(true)}
      />

      <CoursesSearchBar
        activeTab={logic.activeTab}
        listSearch={logic.listSearch}
        setListSearch={logic.setListSearch}
      />

      {logic.activeTab === 'org' ? (
        <div className="space-y-4">
          <StatsRow
            courseCount={logic.activeHierarchy.length}
            pathCount={logic.activeOrganizationLearningPaths.length}
          />
          <UnifiedOrgGrid
            items={logic.unifiedOrgItems}
            onRemoveCourse={logic.handleRemoveHierarchy}
            onRemovePath={logic.handleRemoveOrganizationLearningPath}
            onSetDefault={logic.openDefaultModal}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <StatsRow
            courseCount={logic.activeUserAssignments.length}
            pathCount={logic.activeUserLearningPathAssignments.length}
          />
          <UnifiedUserAssignmentsTable
            items={logic.unifiedUserItems}
            onRemoveCourse={logic.handleRemoveUserAssignment}
          />
        </div>
      )}

      <CatalogModal
        isOpen={logic.isCatalogOpen}
        onClose={() => logic.setIsCatalogOpen(false)}
        catalogSearch={logic.catalogSearch}
        setCatalogSearch={logic.setCatalogSearch}
        filteredCatalog={logic.filteredCatalog}
        hierarchyCourses={logic.hierarchyCourses}
        assigningId={logic.assigningId}
        onAssign={logic.handleAssignToOrg}
      />

      <LearningPathCatalogModal
        isOpen={logic.isLearningPathCatalogOpen}
        onClose={() => logic.setIsLearningPathCatalogOpen(false)}
        search={logic.learningPathCatalogSearch}
        setSearch={logic.setLearningPathCatalogSearch}
        filteredLearningPaths={logic.filteredLearningPathCatalog}
        activeAssignments={logic.organizationLearningPaths}
        assigningId={logic.assigningId}
        onAssign={logic.handleAssignLearningPathToOrg}
      />

      <AssignUserModal
        isOpen={logic.isAssignUserModalOpen}
        onClose={() => logic.setIsAssignUserModalOpen(false)}
        members={logic.members}
        allCourses={logic.allCourses}
        selectedUserForCourse={logic.selectedUserForCourse}
        setSelectedUserForCourse={logic.setSelectedUserForCourse}
        selectedCourseForUser={logic.selectedCourseForUser}
        setSelectedCourseForUser={logic.setSelectedCourseForUser}
        isAssigning={logic.isAssigning}
        onConfirm={logic.handleAssignToUser}
      />

      <ContentDefaultModal
        isOpen={!!logic.defaultModalTarget}
        onClose={logic.closeDefaultModal}
        companyId={companyId}
        target={logic.defaultModalTarget}
        rules={logic.defaultModalTarget?.kind === 'path' ? logic.learningPathDefaultRules : logic.courseDefaultRules}
        nodes={logic.hierarchyNodes}
        onChanged={logic.handleDefaultChanged}
      />
    </div>
  )
}
