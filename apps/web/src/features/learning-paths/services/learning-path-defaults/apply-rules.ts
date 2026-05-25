import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import { assignLearningPathToUsers } from './assignments'
import { listHierarchyNodeOptions } from './hierarchy-nodes'
import { addBulkApplyResult, createEmptyBulkApplyResult } from './results'
import { listDefaultRules } from './rules'
import { resolveTargetUserIds } from './target-users'
import type { LearningPathDefaultRule, OrganizationNodeUserRow, OrganizationUserRow } from './types'

export async function applyDefaultRules(params: { organizationId: string; ruleIds?: string[]; appliedBy?: string | null }) {
  const rules = (await listDefaultRules(params.organizationId)).filter(
    (rule) => rule.status === 'active' && (!params.ruleIds || params.ruleIds.includes(rule.id)) && rule.learning_path?.is_active !== false,
  )
  const aggregate = { rulesApplied: rules.length, ...createEmptyBulkApplyResult() }

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
    addBulkApplyResult(aggregate, result)
  }
  return aggregate
}

export async function applyDefaultRulesForUser(params: { organizationId: string; userId: string }) {
  const membership = await getActiveMembership(params.organizationId, params.userId)
  if (!membership) return { rulesApplied: 0, ...createEmptyBulkApplyResult() }

  const activeRules = (await listDefaultRules(params.organizationId)).filter((rule) => rule.status === 'active' && rule.learning_path?.is_active !== false)
  if (activeRules.length === 0) return { rulesApplied: 0, ...createEmptyBulkApplyResult() }

  const applicableRules = await filterApplicableRules(params, activeRules)
  const aggregate = { rulesApplied: applicableRules.length, ...createEmptyBulkApplyResult(applicableRules.length > 0 ? 1 : 0) }

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

async function getActiveMembership(organizationId: string, userId: string) {
  const supabase = createAdminClient()
  const { data, error } = await fromLoose<OrganizationUserRow>(supabase, 'organization_users')
    .select('user_id, status')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()
  if (error) logger.error('Error validating membership for default learning paths:', error)
  return data || null
}

async function filterApplicableRules(params: { organizationId: string; userId: string }, rules: LearningPathDefaultRule[]) {
  const supabase = createAdminClient()
  const { data: memberships } = await fromLoose<OrganizationNodeUserRow>(supabase, 'organization_node_users').select('node_id, user_id').eq('user_id', params.userId)
  const userNodeIds = new Set((memberships || []).map((row) => row.node_id))
  const userNodes = (await listHierarchyNodeOptions(params.organizationId)).filter((node) => userNodeIds.has(node.id))
  return rules.filter((rule) => rule.scope_type === 'organization' || Boolean(rule.node_id && rule.node && (userNodeIds.has(rule.node_id) || (rule.include_descendants && userNodes.some((node) => node.path.startsWith(rule.node?.path + '.'))))))
}
