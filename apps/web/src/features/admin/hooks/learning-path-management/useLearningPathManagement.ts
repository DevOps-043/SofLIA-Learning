'use client'

import { useTranslation } from 'react-i18next'
import { useLearningPathAssignmentActions } from './useLearningPathAssignmentActions'
import { useLearningPathData } from './useLearningPathData'
import { useLearningPathDerivedData } from './useLearningPathDerivedData'
import { useLearningPathItemActions } from './useLearningPathItemActions'
import { useLearningPathMetadataActions } from './useLearningPathMetadataActions'
import { useLearningPathRevokeActions } from './useLearningPathRevokeActions'
import { useLearningPathState } from './useLearningPathState'
import type { Translate, UseLearningPathManagementProps } from './types'

export function useLearningPathManagement({ learningPathId }: UseLearningPathManagementProps) {
  const { t } = useTranslation('admin')
  const state = useLearningPathState()
  const translate = t as Translate
  const loadData = useLearningPathData({ learningPathId, state, t: translate })
  const derived = useLearningPathDerivedData(state)
  const metadataActions = useLearningPathMetadataActions({ learningPathId, state, t: translate })
  const itemActions = useLearningPathItemActions({ learningPathId, loadData, state, t: translate })
  const assignmentActions = useLearningPathAssignmentActions({ learningPathId, loadData, state, t: translate })
  const revokeActions = useLearningPathRevokeActions({ loadData, state, t: translate })

  return {
    learningPath: state.learningPath,
    availableCourses: derived.availableCourses,
    availableOrganizations: derived.availableOrganizations,
    selectedUserOrganizationMembers: derived.selectedUserOrganizationMembers,
    activeOrganizationAssignments: derived.activeOrganizationAssignments,
    activeUserAssignments: derived.activeUserAssignments,
    selectedCourseId: state.selectedCourseId,
    selectedOrganizationId: state.selectedOrganizationId,
    selectedUserOrganizationId: state.selectedUserOrganizationId,
    selectedUserId: state.selectedUserId,
    loading: state.loading,
    saving: state.saving,
    error: state.error,
    removeTargetId: state.removeTargetId,
    organizationAssignmentToRevoke: state.organizationAssignmentToRevoke,
    userAssignmentToRevoke: state.userAssignmentToRevoke,
    setLearningPath: state.setLearningPath,
    setSelectedCourseId: state.setSelectedCourseId,
    setSelectedOrganizationId: state.setSelectedOrganizationId,
    setSelectedUserOrganizationId: state.setSelectedUserOrganizationId,
    setSelectedUserId: state.setSelectedUserId,
    setRemoveTargetId: state.setRemoveTargetId,
    setOrganizationAssignmentToRevoke: state.setOrganizationAssignmentToRevoke,
    setUserAssignmentToRevoke: state.setUserAssignmentToRevoke,
    ...metadataActions,
    ...itemActions,
    ...assignmentActions,
    ...revokeActions,
  }
}
