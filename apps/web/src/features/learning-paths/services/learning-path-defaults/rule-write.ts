import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import {
  isMissingDefaultRulesInfrastructureError,
  throwMissingDefaultRulesMigrationError,
} from './infrastructure'
import type { LearningPathDefaultRuleRow, LearningPathDefaultScopeType } from './types'

type ResolvedDefaultRuleParams = {
  organizationId: string
  learningPathId: string
  scopeType: LearningPathDefaultScopeType
  nodeId: string | null
  includeDescendants: boolean
  createdBy: string
}

export async function reactivateRule(id: string, params: ResolvedDefaultRuleParams) {
  const { error } = await fromLoose<LearningPathDefaultRuleRow>(
    createAdminClient(),
    'organization_learning_path_default_rules',
  )
    .update({
      status: 'active',
      include_descendants: params.includeDescendants,
      created_by: params.createdBy,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (!error) return id
  logger.error('Error reactivating default learning path rule:', error)
  if (isMissingDefaultRulesInfrastructureError(error)) throwMissingDefaultRulesMigrationError()
  throw new Error('No se pudo activar la regla predeterminada')
}

export async function createRule(params: ResolvedDefaultRuleParams) {
  const { data, error } = await fromLoose<LearningPathDefaultRuleRow>(
    createAdminClient(),
    'organization_learning_path_default_rules',
  )
    .insert({
      organization_id: params.organizationId,
      learning_path_id: params.learningPathId,
      scope_type: params.scopeType,
      node_id: params.scopeType === 'node' ? params.nodeId : null,
      include_descendants: params.includeDescendants,
      status: 'active',
      created_by: params.createdBy,
    })
    .select('id')
    .single()

  if (!error && data) return data.id
  logger.error('Error creating default learning path rule:', error)
  if (isMissingDefaultRulesInfrastructureError(error)) throwMissingDefaultRulesMigrationError()
  throw new Error('No se pudo crear la regla predeterminada')
}
