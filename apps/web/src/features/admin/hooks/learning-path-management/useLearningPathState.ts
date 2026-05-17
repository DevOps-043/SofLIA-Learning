import { useState } from 'react'
import type {
  AdminCompany,
  LearningPath,
  LearningPathAssignmentOverview,
  LearningPathOrganizationAssignmentSummary,
  LearningPathUserAssignmentSummary,
} from '../../types'
import type { CourseOption } from './types'

export function useLearningPathState() {
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null)
  const [allCourses, setAllCourses] = useState<CourseOption[]>([])
  const [companies, setCompanies] = useState<AdminCompany[]>([])
  const [assignmentOverview, setAssignmentOverview] = useState<LearningPathAssignmentOverview>({
    organizationAssignments: [],
    userAssignments: [],
  })
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [selectedOrganizationId, setSelectedOrganizationId] = useState('')
  const [selectedUserOrganizationId, setSelectedUserOrganizationId] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [removeTargetId, setRemoveTargetId] = useState<string | null>(null)
  const [organizationAssignmentToRevoke, setOrganizationAssignmentToRevoke] =
    useState<LearningPathOrganizationAssignmentSummary | null>(null)
  const [userAssignmentToRevoke, setUserAssignmentToRevoke] =
    useState<LearningPathUserAssignmentSummary | null>(null)

  return {
    allCourses,
    assignmentOverview,
    companies,
    error,
    learningPath,
    loading,
    organizationAssignmentToRevoke,
    removeTargetId,
    saving,
    selectedCourseId,
    selectedOrganizationId,
    selectedUserId,
    selectedUserOrganizationId,
    setAllCourses,
    setAssignmentOverview,
    setCompanies,
    setError,
    setLearningPath,
    setLoading,
    setOrganizationAssignmentToRevoke,
    setRemoveTargetId,
    setSaving,
    setSelectedCourseId,
    setSelectedOrganizationId,
    setSelectedUserId,
    setSelectedUserOrganizationId,
    setUserAssignmentToRevoke,
    userAssignmentToRevoke,
  }
}

export type LearningPathStateController = ReturnType<typeof useLearningPathState>
