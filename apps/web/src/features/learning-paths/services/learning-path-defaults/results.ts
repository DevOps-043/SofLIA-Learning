import type { LearningPathBulkApplyResult } from './types'

export function createEmptyBulkApplyResult(targetUsers = 0): LearningPathBulkApplyResult {
  return { targetUsers, assigned: 0, existing: 0, reactivated: 0, skippedRevoked: 0 }
}

export function addBulkApplyResult(target: LearningPathBulkApplyResult, source: LearningPathBulkApplyResult) {
  target.targetUsers += source.targetUsers
  target.assigned += source.assigned
  target.existing += source.existing
  target.reactivated += source.reactivated
  target.skippedRevoked += source.skippedRevoked
}
