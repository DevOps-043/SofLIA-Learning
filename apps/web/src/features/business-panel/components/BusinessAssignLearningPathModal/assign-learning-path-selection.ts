import { BusinessLearningPathsService } from '../../services/businessLearningPaths.service'
import type { AssignmentMode } from './types'

export function assignLearningPathSelection({
  assignmentMode,
  includeDescendants,
  learningPathId,
  orgSlug,
  selectedNodeIds,
  selectedUserIds,
}: {
  assignmentMode: AssignmentMode
  includeDescendants: boolean
  learningPathId: string
  orgSlug: string
  selectedNodeIds: Set<string>
  selectedUserIds: Set<string>
}) {
  if (assignmentMode === 'users') {
    return BusinessLearningPathsService.assignLearningPath(orgSlug, learningPathId, Array.from(selectedUserIds))
  }

  if (assignmentMode === 'all') {
    return BusinessLearningPathsService.assignLearningPath(orgSlug, learningPathId, { type: 'all' })
  }

  return BusinessLearningPathsService.assignLearningPath(orgSlug, learningPathId, {
    type: 'node',
    nodeIds: Array.from(selectedNodeIds),
    includeDescendants,
  })
}
