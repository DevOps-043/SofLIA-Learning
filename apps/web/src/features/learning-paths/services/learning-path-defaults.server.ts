import 'server-only'

import { applyDefaultRules, applyDefaultRulesForUser } from './learning-path-defaults/apply-rules'
import { assignLearningPathToTarget, assignLearningPathToUsers } from './learning-path-defaults/assignments'
import { listHierarchyNodeOptions } from './learning-path-defaults/hierarchy-nodes'
import { createOrReactivateDefaultRule, listDefaultRules } from './learning-path-defaults/rules'
import { revokeDefaultRule } from './learning-path-defaults/revoke-rule'
import { resolveTargetUserIds } from './learning-path-defaults/target-users'

export type {
  LearningPathBulkApplyResult,
  LearningPathDefaultRule,
  LearningPathDefaultScopeType,
  LearningPathHierarchyNodeOption,
  LearningPathTarget,
} from './learning-path-defaults/types'

export class LearningPathDefaultsService {
  static listHierarchyNodeOptions = listHierarchyNodeOptions
  static listDefaultRules = listDefaultRules
  static createOrReactivateDefaultRule = createOrReactivateDefaultRule
  static revokeDefaultRule = revokeDefaultRule
  static resolveTargetUserIds = resolveTargetUserIds
  static assignLearningPathToUsers = assignLearningPathToUsers
  static assignLearningPathToTarget = assignLearningPathToTarget
  static applyDefaultRules = applyDefaultRules
  static applyDefaultRulesForUser = applyDefaultRulesForUser
}
