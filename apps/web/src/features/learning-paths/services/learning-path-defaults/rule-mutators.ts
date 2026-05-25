import { AdminLearningPathsService } from '@/features/admin/services/adminLearningPaths.service'
import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import {
  DEFAULT_RULE_SELECT,
  isMissingDefaultRulesInfrastructureError,
  throwMissingDefaultRulesMigrationError,
} from './infrastructure'
import { listHierarchyNodeOptions } from './list'
import { createRule, reactivateRule } from './rule-write'
import type { LearningPathDefaultRuleRow, LearningPathDefaultScopeType } from './types'

type DefaultRuleParams = {
  organizationId: string
  learningPathId: string
  scopeType: LearningPathDefaultScopeType
  nodeId?: string | null
  includeDescendants?: boolean
  createdBy: string
}

async function validateDefaultRuleInput(params: Required<DefaultRuleParams>) {
  const learningPath = await AdminLearningPathsService.getLearningPathById(params.learningPathId)
  if (!learningPath || !learningPath.is_active) {
    throw new Error('La ruta de aprendizaje no esta disponible')
  }

  if (params.scopeType !== 'node') return
  if (!params.nodeId) throw new Error('Selecciona un nodo para la regla predeterminada')

  const nodes = await listHierarchyNodeOptions(params.organizationId)
  if (!nodes.some((node) => node.id === params.nodeId)) {
    throw new Error('El nodo seleccionado no pertenece a la organizacion')
  }
}

async function findExistingRule(params: Required<DefaultRuleParams>) {
  const supabase = createAdminClient()
  let query = fromLoose<LearningPathDefaultRuleRow>(
    supabase,
    'organization_learning_path_default_rules',
  )
    .select(DEFAULT_RULE_SELECT)
    .eq('organization_id', params.organizationId)
    .eq('learning_path_id', params.learningPathId)
    .eq('scope_type', params.scopeType)

  query = params.scopeType === 'organization'
    ? query.is('node_id', null)
    : query.eq('node_id', params.nodeId)

  const existing = await query.maybeSingle()
  if (!existing.error) return existing.data
  logger.error('Error checking default learning path rule:', existing.error)
  if (isMissingDefaultRulesInfrastructureError(existing.error)) throwMissingDefaultRulesMigrationError()
  throw new Error('No se pudo validar la regla predeterminada')
}

export async function createOrReactivateDefaultRule(params: DefaultRuleParams) {
  const resolved = { ...params, nodeId: params.nodeId || null, includeDescendants: params.includeDescendants ?? true }
  await validateDefaultRuleInput(resolved)
  const existing = await findExistingRule(resolved)
  return existing ? reactivateRule(existing.id, resolved) : createRule(resolved)
}

export async function revokeDefaultRule(params: { organizationId: string; ruleId: string }) {
  const { error } = await fromLoose<LearningPathDefaultRuleRow>(
    createAdminClient(),
    'organization_learning_path_default_rules',
  )
    .update({ status: 'revoked', updated_at: new Date().toISOString() })
    .eq('organization_id', params.organizationId)
    .eq('id', params.ruleId)

  if (!error) return
  logger.error('Error revoking default learning path rule:', error)
  if (isMissingDefaultRulesInfrastructureError(error)) throwMissingDefaultRulesMigrationError()
  throw new Error('No se pudo desactivar la regla predeterminada')
}
