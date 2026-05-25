import { BusinessLearningPathsService } from '../../services/businessLearningPaths.service'
import type { AssignmentMode } from './types'

export async function assignLearningPathByMode(params: {
  assignmentMode: AssignmentMode
  includeDescendants: boolean
  learningPathId: string
  orgSlug: string
  selectedNodeIds: Set<string>
  selectedUserIds: Set<string>
}) {
  if (params.assignmentMode === 'users') {
    await BusinessLearningPathsService.assignLearningPath(params.orgSlug, params.learningPathId, Array.from(params.selectedUserIds))
    return
  }
  if (params.assignmentMode === 'all') {
    await BusinessLearningPathsService.assignLearningPath(params.orgSlug, params.learningPathId, { type: 'all' })
    return
  }
  await BusinessLearningPathsService.assignLearningPath(params.orgSlug, params.learningPathId, {
    type: 'node',
    nodeIds: Array.from(params.selectedNodeIds),
    includeDescendants: params.includeDescendants,
  })
}
