import { LearningPathDefaultsService } from '@/features/learning-paths/services/learning-path-defaults.server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import { assignCourseToUsers } from './assignments'
import { emptyCourseAssignResult } from './infrastructure'
import { listDefaultRules } from './rules'
import type { CourseBulkApplyResult, CourseDefaultRule, OrganizationNodeUserRow, OrganizationUserRow } from './types'

export async function applyDefaultRules(params: {
  organizationId: string
  ruleIds?: string[]
  appliedBy?: string | null
}): Promise<CourseBulkApplyResult> {
  const rules = (await listDefaultRules(params.organizationId)).filter(
    (rule) => rule.status === 'active' && (!params.ruleIds || params.ruleIds.includes(rule.id)) && rule.course?.is_active !== false,
  )

  const aggregate = { rulesApplied: rules.length, ...emptyCourseAssignResult() }

  for (const rule of rules) {
    const userIds = await LearningPathDefaultsService.resolveTargetUserIds(rule.organization_id, {
      type: rule.scope_type === 'organization' ? 'all' : 'node',
      nodeIds: rule.node_id ? [rule.node_id] : [],
      includeDescendants: rule.include_descendants,
    })
    const result = await assignCourseToUsers({
      organizationId: rule.organization_id,
      courseId: rule.course_id,
      userIds,
      assignedBy: rule.created_by || params.appliedBy || null,
      assignmentSource: 'default_rule',
      defaultRuleId: rule.id,
    })
    aggregate.targetUsers += result.targetUsers
    aggregate.assigned += result.assigned
    aggregate.existing += result.existing
  }

  return aggregate
}

export async function applyDefaultRulesForUser(params: {
  organizationId: string
  userId: string
}): Promise<CourseBulkApplyResult> {
  const membership = await getActiveMembership(params.organizationId, params.userId)
  if (!membership) return { rulesApplied: 0, ...emptyCourseAssignResult() }

  const activeRules = (await listDefaultRules(params.organizationId)).filter(
    (rule) => rule.status === 'active' && rule.course?.is_active !== false,
  )
  if (activeRules.length === 0) return { rulesApplied: 0, ...emptyCourseAssignResult() }

  const applicableRules = await filterApplicableRules(params, activeRules)
  const aggregate = { rulesApplied: applicableRules.length, ...emptyCourseAssignResult(applicableRules.length > 0 ? 1 : 0) }

  for (const rule of applicableRules) {
    const result = await assignCourseToUsers({
      organizationId: params.organizationId,
      courseId: rule.course_id,
      userIds: [params.userId],
      assignedBy: rule.created_by || params.userId,
      assignmentSource: 'default_rule',
      defaultRuleId: rule.id,
    })
    aggregate.assigned += result.assigned
    aggregate.existing += result.existing
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

  if (error) logger.error('Error validating membership for default course rules:', error)
  return data || null
}

async function filterApplicableRules(
  params: { organizationId: string; userId: string },
  rules: CourseDefaultRule[],
) {
  const supabase = createAdminClient()
  const { data: memberships } = await fromLoose<OrganizationNodeUserRow>(supabase, 'organization_node_users')
    .select('node_id, user_id')
    .eq('user_id', params.userId)

  const userNodeIds = new Set((memberships || []).map((row) => row.node_id))
  const userNodes = (await LearningPathDefaultsService.listHierarchyNodeOptions(params.organizationId)).filter((node) =>
    userNodeIds.has(node.id),
  )

  return rules.filter(
    (rule) =>
      rule.scope_type === 'organization' ||
      Boolean(
        rule.node_id &&
          rule.node &&
          (userNodeIds.has(rule.node_id) ||
            (rule.include_descendants && userNodes.some((node) => node.path.startsWith(`${rule.node?.path}.`)))),
      ),
  )
}
