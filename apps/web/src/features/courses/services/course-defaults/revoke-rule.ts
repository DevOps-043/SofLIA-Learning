import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import {
  isMissingCourseDefaultRulesInfrastructureError,
  throwMissingCourseDefaultRulesMigrationError,
} from './infrastructure'
import type { CourseDefaultRuleRow } from './types'

export async function revokeDefaultRule(params: { organizationId: string; ruleId: string }) {
  const supabase = createAdminClient()
  const { error } = await fromLoose<CourseDefaultRuleRow>(supabase, 'organization_course_default_rules')
    .update({ status: 'revoked', updated_at: new Date().toISOString() })
    .eq('organization_id', params.organizationId)
    .eq('id', params.ruleId)

  if (error) {
    logger.error('Error revoking default course rule:', error)
    if (isMissingCourseDefaultRulesInfrastructureError(error)) throwMissingCourseDefaultRulesMigrationError()
    throw new Error('No se pudo desactivar la regla predeterminada')
  }
}
