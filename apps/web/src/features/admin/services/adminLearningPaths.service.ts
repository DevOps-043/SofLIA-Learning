import 'server-only'

import { addLearningPathItem } from './admin-learning-paths/add-item.service'
import { assignLearningPathToOrganization } from './admin-learning-paths/assign-organization.service'
import { assignLearningPathToUser } from './admin-learning-paths/assign-user.service'
import { createLearningPath } from './admin-learning-paths/create-learning-path.service'
import { deleteLearningPath } from './admin-learning-paths/delete-learning-path.service'
import { getLearningPathAssignmentOverview } from './admin-learning-paths/assignment-overview.service'
import { getLearningPathById, listLearningPaths } from './admin-learning-paths/read-learning-paths.service'
import { listOrganizationAssignments } from './admin-learning-paths/list-organization-assignments.service'
import { listUserAssignments } from './admin-learning-paths/list-user-assignments.service'
import { removeLearningPathItem } from './admin-learning-paths/remove-item.service'
import { reorderLearningPathItems } from './admin-learning-paths/reorder-items.service'
import { revokeLearningPathFromOrganization } from './admin-learning-paths/revoke-organization.service'
import { revokeLearningPathFromUser } from './admin-learning-paths/revoke-user.service'
import { updateLearningPath } from './admin-learning-paths/update-learning-path.service'

/**
 * Aggregation point for all admin learning-path operations.
 * Each method delegates directly to its domain service — this object
 * exists solely to provide a single import for route handlers.
 */
export const AdminLearningPathsService = {
  listLearningPaths,
  getLearningPathById,
  createLearningPath,
  updateLearningPath,
  deleteLearningPath,
  addItem: addLearningPathItem,
  removeItem: removeLearningPathItem,
  reorderItems: reorderLearningPathItems,
  listOrganizationAssignments,
  assignToOrganization: assignLearningPathToOrganization,
  revokeFromOrganization: revokeLearningPathFromOrganization,
  listUserAssignments,
  assignToUser: assignLearningPathToUser,
  revokeFromUser: revokeLearningPathFromUser,
  listAssignmentsForLearningPath: getLearningPathAssignmentOverview,
} as const
