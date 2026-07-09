import 'server-only'

import { addLearningPathItem } from './admin-learning-paths/add-learning-path-item.service'
import {
  assignToOrganization,
  listOrganizationAssignments,
  revokeFromOrganization,
} from './admin-learning-paths/organization-assignment.service'
import { assignToUser } from './admin-learning-paths/assign-user-learning-path.service'
import { createLearningPath } from './admin-learning-paths/create-learning-path.service'
import {
  deleteLearningPath,
  deleteLearningPathWithCourseCleanup,
} from './admin-learning-paths/delete-learning-path.service'
import { getLearningPathById, listLearningPaths } from './admin-learning-paths/learning-paths.query'
import { listAssignmentsForLearningPath } from './admin-learning-paths/assignment-overview.service'
import { forceRevokeCourseAccess } from './admin-learning-paths/course-access-provenance-cleanup.service'
import {
  listUserAssignments,
  revokeFromUser,
  revokeFromUserWithCourseCleanup,
} from './admin-learning-paths/user-assignments.service'
import { removeLearningPathItem } from './admin-learning-paths/remove-learning-path-item.service'
import { reorderLearningPathItems } from './admin-learning-paths/reorder-learning-path-items.service'
import { updateLearningPath } from './admin-learning-paths/update-learning-path.service'

export class AdminLearningPathsService {
  static listLearningPaths = listLearningPaths
  static getLearningPathById = getLearningPathById
  static createLearningPath = createLearningPath
  static updateLearningPath = updateLearningPath
  static deleteLearningPath = deleteLearningPath
  static deleteLearningPathWithCourseCleanup = deleteLearningPathWithCourseCleanup
  static addItem = addLearningPathItem
  static removeItem = removeLearningPathItem
  static reorderItems = reorderLearningPathItems
  static listOrganizationAssignments = listOrganizationAssignments
  static assignToOrganization = assignToOrganization
  static revokeFromOrganization = revokeFromOrganization
  static listUserAssignments = listUserAssignments
  static assignToUser = assignToUser
  static revokeFromUser = revokeFromUser
  static revokeFromUserWithCourseCleanup = revokeFromUserWithCourseCleanup
  static listAssignmentsForLearningPath = listAssignmentsForLearningPath
  static forceRevokeCourseAccess = forceRevokeCourseAccess
}
