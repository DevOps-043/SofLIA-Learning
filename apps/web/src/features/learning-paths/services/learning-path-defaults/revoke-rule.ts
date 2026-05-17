import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import { isMissingDefaultRulesInfrastructureError, throwMissingDefaultRulesMigrationError } from './errors'
import type { LearningPathDefaultRuleRow } from './types'

export async function revokeDefaultRule(params: { organizationId: string; ruleId: string }) {
  const supabase = createAdminClient()
  const { error } = await fromLoose<LearningPathDefaultRuleRow>(supabase, 'organization_learning_path_default_rules')
    .update({ status: 'revoked', updated_at: new Date().toISOString() })
    .eq('organization_id', params.organizationId)
    .eq('id', params.ruleId)

  if (error) {
    logger.error('Error revoking default learning path rule:', error)
    if (isMissingDefaultRulesInfrastructureError(error)) throwMissingDefaultRulesMigrationError()
    throw new Error('No se pudo desactivar la regla predeterminada')
  }
}
