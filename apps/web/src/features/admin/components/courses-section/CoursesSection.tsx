'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ToastNotification } from '@/core/components/ToastNotification/ToastNotification'
import { useCourseSectionLogic } from './useCourseSectionLogic'
import { OrgCoursesGrid, UserAssignmentsTable } from './CoursesList'
import { CoursesHeader, CoursesSearchBar, CatalogModal, AssignUserModal } from './CoursesFilters'
import { colors } from './courses-section.types'

interface CoursesSectionProps {
  companyId: string
}

export const CoursesSection: React.FC<CoursesSectionProps> = ({ companyId }) => {
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
        onAssignUser={() => logic.setIsAssignUserModalOpen(true)}
      />

      <CoursesSearchBar
        activeTab={logic.activeTab}
        listSearch={logic.listSearch}
        setListSearch={logic.setListSearch}
      />

      {logic.activeTab === 'org' ? (
        <OrgCoursesGrid
          activeHierarchy={logic.activeHierarchy}
          onRemove={logic.handleRemoveHierarchy}
        />
      ) : (
        <UserAssignmentsTable
          activeUserAssignments={logic.activeUserAssignments}
          onRemove={logic.handleRemoveUserAssignment}
        />
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
