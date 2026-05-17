import { AdminLearningPathsService } from '@/features/admin/services/adminLearningPaths.service'
import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import { isMissingDefaultRulesInfrastructureError, throwMissingDefaultRulesMigrationError } from './errors'
import { listHierarchyNodeOptions } from './hierarchy-nodes'
import { mapRule, optionToNodeRow } from './mappers'
import { createDefaultRule, reactivateDefaultRule } from './rule-mutations'
import type { LearningPathDefaultRule, LearningPathDefaultRuleRow, LearningPathDefaultScopeType, OrganizationNodeRow } from './types'

const DEFAULT_RULE_COLUMNS = 'id, organization_id, learning_path_id, scope_type, node_id, include_descendants, status, created_by, created_at, updated_at'

export async function listDefaultRules(organizationId: string): Promise<LearningPathDefaultRule[]> {
  const supabase = createAdminClient()
  const { data, error } = await fromLoose<LearningPathDefaultRuleRow>(supabase, 'organization_learning_path_default_rules')
    .select(DEFAULT_RULE_COLUMNS)
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
  const nodeMap = new Map<string, OrganizationNodeRow>(nodes.map((node) => [node.id, optionToNodeRow(node, organizationId)]))
  return (data || []).map((row) => mapRule(row, learningPathMap, nodeMap))
}

export async function createOrReactivateDefaultRule(params: {
  organizationId: string
  learningPathId: string
  scopeType: LearningPathDefaultScopeType
  nodeId?: string | null
  includeDescendants?: boolean
  createdBy: string
}) {
  await validateDefaultRuleInput(params)
  const supabase = createAdminClient()
  const existingQuery = buildExistingRuleQuery(supabase, params)
  const existing = await existingQuery.maybeSingle()

  if (existing.error) {
    logger.error('Error checking default learning path rule:', existing.error)
    if (isMissingDefaultRulesInfrastructureError(existing.error)) throwMissingDefaultRulesMigrationError()
    throw new Error('No se pudo validar la regla predeterminada')
  }
  return existing.data ? reactivateDefaultRule(existing.data.id, params) : createDefaultRule(params)
}

async function validateDefaultRuleInput(params: { organizationId: string; learningPathId: string; scopeType: LearningPathDefaultScopeType; nodeId?: string | null }) {
  const learningPath = await AdminLearningPathsService.getLearningPathById(params.learningPathId)
  if (!learningPath || !learningPath.is_active) throw new Error('La ruta de aprendizaje no esta disponible')
  if (params.scopeType !== 'node') return
  if (!params.nodeId) throw new Error('Selecciona un nodo para la regla predeterminada')
  const nodes = await listHierarchyNodeOptions(params.organizationId)
  if (!nodes.some((node) => node.id === params.nodeId)) throw new Error('El nodo seleccionado no pertenece a la organizacion')
}

function buildExistingRuleQuery(supabase: ReturnType<typeof createAdminClient>, params: { organizationId: string; learningPathId: string; scopeType: LearningPathDefaultScopeType; nodeId?: string | null }) {
  const query = fromLoose<LearningPathDefaultRuleRow>(supabase, 'organization_learning_path_default_rules')
    .select(DEFAULT_RULE_COLUMNS)
    .eq('organization_id', params.organizationId)
    .eq('learning_path_id', params.learningPathId)
    .eq('scope_type', params.scopeType)
  return params.scopeType === 'organization' ? query.is('node_id', null) : query.eq('node_id', params.nodeId || '')
}
