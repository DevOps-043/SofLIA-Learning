import type { Dispatch, SetStateAction } from 'react'
import type { AssignmentMode, BusinessTranslate } from './types'

export function validateAssignmentSelection({
  assignmentMode,
  selectedNodeIds,
  selectedUserIds,
  setError,
  t,
}: {
  assignmentMode: AssignmentMode
  selectedNodeIds: Set<string>
  selectedUserIds: Set<string>
  setError: Dispatch<SetStateAction<string | null>>
  t: BusinessTranslate
}) {
  if (assignmentMode === 'users' && selectedUserIds.size === 0) {
    setError(t('assignLearningPath.selectUserError'))
    return false
  }
  if (assignmentMode === 'node' && selectedNodeIds.size === 0) {
    setError(t('assignLearningPath.selectNodeError'))
    return false
  }
  return true
}
