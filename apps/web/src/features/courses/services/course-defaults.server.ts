import 'server-only'

import { LearningPathDefaultsService } from '@/features/learning-paths/services/learning-path-defaults.server'
import { applyDefaultRules, applyDefaultRulesForUser } from './course-defaults/apply-rules'
import { assignCourseToUsers } from './course-defaults/assignments'
import { createOrReactivateDefaultRule, listDefaultRules } from './course-defaults/rules'
import { revokeDefaultRule } from './course-defaults/revoke-rule'

export type {
  CourseAssignmentSource,
  CourseAssignResult,
  CourseBulkApplyResult,
  CourseDefaultRule,
  CourseDefaultScopeType,
} from './course-defaults/types'

export class CourseDefaultsService {
  static listHierarchyNodeOptions = LearningPathDefaultsService.listHierarchyNodeOptions
  static resolveTargetUserIds = LearningPathDefaultsService.resolveTargetUserIds
  static listDefaultRules = listDefaultRules
  static createOrReactivateDefaultRule = createOrReactivateDefaultRule
  static revokeDefaultRule = revokeDefaultRule
  static assignCourseToUsers = assignCourseToUsers
  static applyDefaultRules = applyDefaultRules
  static applyDefaultRulesForUser = applyDefaultRulesForUser
}
