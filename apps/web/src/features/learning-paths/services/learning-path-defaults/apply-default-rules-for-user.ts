import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import { assignLearningPathToUsers } from './assignments'
import { emptyBulkApplyResult } from './infrastructure'
import { listDefaultRules, listHierarchyNodeOptions } from './list'
import type { LearningPathDefaultRule, OrganizationNodeUserRow, OrganizationUserRow } from './types'

async function hasActiveMembership(organizationId: string, userId: string) {
  const { data, error } = await fromLoose<OrganizationUserRow>(createAdminClient(), 'organization_users')
    .select('user_id, status')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (error) logger.error('Error validating membership for default learning paths:', error)
  return Boolean(data)
}

async function loadUserNodeIds(userId: string) {
  const { data } = await fromLoose<OrganizationNodeUserRow>(
    createAdminClient(),
    'organization_node_users',
  )
    .select('node_id, user_id')
    .eq('user_id', userId)

  return new Set((data || []).map((row) => row.node_id))
}

function isRuleApplicableToUser(rule: LearningPathDefaultRule, userNodeIds: Set<string>, userNodePaths: string[]) {
  if (rule.scope_type === 'organization') return true
  if (!rule.node_id || !rule.node) return false
  if (userNodeIds.has(rule.node_id)) return true
  return rule.include_descendants
    ? userNodePaths.some((path) => path.startsWith(`${rule.node?.path}.`))
    : false
}

export async function applyDefaultRulesForUser(params: { organizationId: string; userId: string }) {
  if (!(await hasActiveMembership(params.organizationId, params.userId))) return emptyBulkApplyResult()

  const activeRules = (await listDefaultRules(params.organizationId)).filter(
    (rule) => rule.status === 'active' && rule.learning_path?.is_active !== false,
  )
  if (activeRules.length === 0) return emptyBulkApplyResult()

  const userNodeIds = await loadUserNodeIds(params.userId)
  const userNodePaths = (await listHierarchyNodeOptions(params.organizationId))
    .filter((node) => userNodeIds.has(node.id))
    .map((node) => node.path)
  const applicableRules = activeRules.filter((rule) =>
    isRuleApplicableToUser(rule, userNodeIds, userNodePaths),
  )
  const aggregate = { ...emptyBulkApplyResult(), rulesApplied: applicableRules.length, targetUsers: applicableRules.length > 0 ? 1 : 0 }

  for (const rule of applicableRules) {
    const result = await assignLearningPathToUsers({
      organizationId: params.organizationId,
      learningPathId: rule.learning_path_id,
      userIds: [params.userId],
      assignedBy: rule.created_by || params.userId,
      assignmentSource: 'default_rule',
      defaultRuleId: rule.id,
      reactivateRevoked: false,
    })
    aggregate.assigned += result.assigned
    aggregate.existing += result.existing
    aggregate.reactivated += result.reactivated
    aggregate.skippedRevoked += result.skippedRevoked
  }

  return aggregate
}
