import { AdminLearningPathsService } from '@/features/admin/services/adminLearningPaths.service'
import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import { DEFAULT_RULE_SELECT, getNodeDepth, isMissingDefaultRulesInfrastructureError } from './infrastructure'
import { mapDefaultRule } from './mappers'
import type {
  LearningPathDefaultRule,
  LearningPathDefaultRuleRow,
  LearningPathHierarchyNodeOption,
  OrganizationNodeRow,
} from './types'

export async function listHierarchyNodeOptions(
  organizationId: string,
): Promise<LearningPathHierarchyNodeOption[]> {
  const supabase = createAdminClient()
  const { data, error } = await fromLoose<OrganizationNodeRow>(supabase, 'organization_nodes')
    .select('id, organization_id, name, type, path, parent_id, is_active')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('path', { ascending: true })

  if (error) {
    logger.error('Error loading hierarchy nodes for learning path defaults:', error)
    return []
  }

  return (data || []).map((node) => ({
    id: node.id,
    name: node.name,
    type: node.type,
    path: node.path,
    parent_id: node.parent_id,
    depth: getNodeDepth(node.path),
  }))
}

export async function listDefaultRules(organizationId: string): Promise<LearningPathDefaultRule[]> {
  const supabase = createAdminClient()
  const { data, error } = await fromLoose<LearningPathDefaultRuleRow>(
    supabase,
    'organization_learning_path_default_rules',
  )
    .select(DEFAULT_RULE_SELECT)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Error loading learning path default rules:', error)
    if (isMissingDefaultRulesInfrastructureError(error)) return []
    throw new Error('No se pudieron cargar las reglas predeterminadas')
  }

  const [learningPaths, nodes] = await Promise.all([
    AdminLearningPathsService.listLearningPaths(),
    listHierarchyNodeOptions(organizationId),
  ])
  const learningPathMap = new Map(learningPaths.map((path) => [path.id, path]))
  const nodeMap = new Map<string, OrganizationNodeRow>(
    nodes.map((node) => [
      node.id,
      { ...node, organization_id: organizationId, is_active: true },
    ]),
  )

  return (data || []).map((row) => mapDefaultRule(row, learningPathMap, nodeMap))
}
