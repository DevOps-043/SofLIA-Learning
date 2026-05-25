import { assignLearningPathToUsers } from './assignments'
import { listDefaultRules } from './list'
import { resolveTargetUserIds } from './target-users'

export async function applyDefaultRules(params: {
  organizationId: string
  ruleIds?: string[]
  appliedBy?: string | null
}) {
  const rules = (await listDefaultRules(params.organizationId)).filter(
    (rule) =>
      rule.status === 'active' &&
      (!params.ruleIds || params.ruleIds.includes(rule.id)) &&
      rule.learning_path?.is_active !== false,
  )
  const aggregate = { rulesApplied: rules.length, targetUsers: 0, assigned: 0, existing: 0, reactivated: 0, skippedRevoked: 0 }

  for (const rule of rules) {
    const userIds = await resolveTargetUserIds(rule.organization_id, {
      type: rule.scope_type === 'organization' ? 'all' : 'node',
      nodeIds: rule.node_id ? [rule.node_id] : [],
      includeDescendants: rule.include_descendants,
    })
    const result = await assignLearningPathToUsers({
      organizationId: rule.organization_id,
      learningPathId: rule.learning_path_id,
      userIds,
      assignedBy: rule.created_by || params.appliedBy || null,
      assignmentSource: 'default_rule',
      defaultRuleId: rule.id,
      reactivateRevoked: false,
    })

    aggregate.targetUsers += result.targetUsers
    aggregate.assigned += result.assigned
    aggregate.existing += result.existing
    aggregate.reactivated += result.reactivated
    aggregate.skippedRevoked += result.skippedRevoked
  }

  return aggregate
}
