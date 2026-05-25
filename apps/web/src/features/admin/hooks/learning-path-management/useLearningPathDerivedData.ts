import { useMemo } from 'react'
import type { LearningPathStateController } from './useLearningPathState'

export function useLearningPathDerivedData(state: LearningPathStateController) {
  const availableCourses = useMemo(() => {
    const usedCourseIds = new Set(state.learningPath?.items.map((item) => item.course_id) || [])
    return state.allCourses.filter((course) => !usedCourseIds.has(course.id))
  }, [state.allCourses, state.learningPath?.items])

  const activeOrganizationAssignments = useMemo(
    () => state.assignmentOverview.organizationAssignments.filter((assignment) => assignment.status === 'active'),
    [state.assignmentOverview.organizationAssignments],
  )

  const activeUserAssignments = useMemo(
    () => state.assignmentOverview.userAssignments.filter((assignment) => assignment.status === 'assigned'),
    [state.assignmentOverview.userAssignments],
  )

  const availableOrganizations = useMemo(() => {
    const assignedIds = new Set(activeOrganizationAssignments.map((assignment) => assignment.organization_id))
    return state.companies.filter((company) => !assignedIds.has(company.id))
  }, [activeOrganizationAssignments, state.companies])

  const selectedUserOrganizationMembers = useMemo(() => {
    const selectedCompany = state.companies.find((company) => company.id === state.selectedUserOrganizationId)
    return selectedCompany?.members || []
  }, [state.companies, state.selectedUserOrganizationId])

  return {
    activeOrganizationAssignments,
    activeUserAssignments,
    availableCourses,
    availableOrganizations,
    selectedUserOrganizationMembers,
  }
}
