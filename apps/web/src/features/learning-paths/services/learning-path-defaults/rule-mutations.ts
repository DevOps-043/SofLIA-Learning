import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import { isMissingDefaultRulesInfrastructureError, throwMissingDefaultRulesMigrationError } from './errors'
import type { LearningPathDefaultRuleRow, LearningPathDefaultScopeType } from './types'

export async function reactivateDefaultRule(ruleId: string, params: {
  includeDescendants?: boolean
  createdBy: string
}) {
  const supabase = createAdminClient()
  const { error } = await fromLoose<LearningPathDefaultRuleRow>(supabase, 'organization_learning_path_default_rules')
    .update({ status: 'active', include_descendants: params.includeDescendants ?? true, created_by: params.createdBy, updated_at: new Date().toISOString() })
    .eq('id', ruleId)

  if (error) {
    logger.error('Error reactivating default learning path rule:', error)
    if (isMissingDefaultRulesInfrastructureError(error)) throwMissingDefaultRulesMigrationError()
    throw new Error('No se pudo activar la regla predeterminada')
  }
  return ruleId
}

export async function createDefaultRule(params: {
  organizationId: string
  learningPathId: string
  scopeType: LearningPathDefaultScopeType
  nodeId?: string | null
  includeDescendants?: boolean
  createdBy: string
}) {
  const supabase = createAdminClient()
  const { data, error } = await fromLoose<LearningPathDefaultRuleRow>(supabase, 'organization_learning_path_default_rules')
    .insert({
      organization_id: params.organizationId,
      learning_path_id: params.learningPathId,
      scope_type: params.scopeType,
      node_id: params.scopeType === 'node' ? params.nodeId : null,
      include_descendants: params.includeDescendants ?? true,
      status: 'active',
      created_by: params.createdBy,
    })
    .select('id')
    .single()

  if (error || !data) {
    logger.error('Error creating default learning path rule:', error)
    if (isMissingDefaultRulesInfrastructureError(error)) throwMissingDefaultRulesMigrationError()
    throw new Error('No se pudo crear la regla predeterminada')
  }
  return data.id
}
