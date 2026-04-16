'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ToastNotification } from '@/core/components/ToastNotification/ToastNotification'
import { useCourseSectionLogic } from './useCourseSectionLogic'
import {
  OrgCoursesGrid,
  OrgLearningPathsGrid,
  UserAssignmentsTable,
  UserLearningPathAssignmentsTable,
} from './CoursesList'
import {
  CoursesHeader,
  CoursesSearchBar,
  CatalogModal,
  LearningPathCatalogModal,
  AssignUserModal,
} from './CoursesFilters'
import { colors } from './courses-section.types'

interface CoursesSectionProps {
  companyId: string
}

export const CoursesSection: React.FC<CoursesSectionProps> = ({ companyId }) => {
  const { t } = useTranslation('admin')
  const logic = useCourseSectionLogic({ companyId })

  if (logic.loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-4 rounded-full" style={{ borderColor: `${colors.accent}20`, borderTopColor: colors.accent }} />
        <p className="text-sm font-medium" style={{ color: colors.grayMedium }}>Preparando catálogo...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ToastNotification
        isOpen={logic.toast.isOpen}
        onClose={() => logic.setToast(prev => ({ ...prev, isOpen: false }))}
        message={logic.toast.message}
        type={logic.toast.type}
      />

      <CoursesHeader
        activeTab={logic.activeTab}
        setActiveTab={logic.setActiveTab}
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
        <div className="space-y-8">
          <div>
            <h4 className="mb-4 text-sm font-black uppercase tracking-[0.2em]" style={{ color: colors.grayMedium }}>
              Cursos Organizacionales
            </h4>
            <OrgCoursesGrid
              activeHierarchy={logic.activeHierarchy}
              onRemove={logic.handleRemoveHierarchy}
            />
          </div>
          <div>
            <h4 className="mb-4 text-sm font-black uppercase tracking-[0.2em]" style={{ color: colors.grayMedium }}>
              Learning Paths Organizacionales
            </h4>
            <OrgLearningPathsGrid
              assignments={logic.activeOrganizationLearningPaths}
              onRemove={logic.handleRemoveOrganizationLearningPath}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div>
            <h4 className="mb-4 text-sm font-black uppercase tracking-[0.2em]" style={{ color: colors.grayMedium }}>
              Cursos Asignados Individualmente
            </h4>
            <UserAssignmentsTable
              activeUserAssignments={logic.activeUserAssignments}
              onRemove={logic.handleRemoveUserAssignment}
            />
          </div>
          <div>
            <h4 className="mb-4 text-sm font-black uppercase tracking-[0.2em]" style={{ color: colors.grayMedium }}>
              Learning Paths Asignados Individualmente
            </h4>
            <p className="mb-4 text-sm" style={{ color: colors.grayMedium }}>
              {t(
                'coursesSection.learningPathAssignmentsManagedByCompany',
                'Las asignaciones individuales de rutas se gestionan desde el panel de cada empresa.',
              )}
            </p>
            <UserLearningPathAssignmentsTable
              assignments={logic.activeUserLearningPathAssignments}
            />
          </div>
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
    </div>
  )
}
