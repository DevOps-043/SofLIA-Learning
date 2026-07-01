import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import {
  isMissingCourseDefaultRulesInfrastructureError,
  throwMissingCourseDefaultRulesMigrationError,
} from './infrastructure'
import type { CourseDefaultRuleRow, CourseDefaultScopeType } from './types'

type ResolvedDefaultRuleParams = {
  organizationId: string
  courseId: string
  scopeType: CourseDefaultScopeType
  nodeId: string | null
  includeDescendants: boolean
  createdBy: string
}

export async function reactivateRule(id: string, params: ResolvedDefaultRuleParams) {
  const { error } = await fromLoose<CourseDefaultRuleRow>(
    createAdminClient(),
    'organization_course_default_rules',
  )
    .update({
      status: 'active',
      include_descendants: params.includeDescendants,
      created_by: params.createdBy,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (!error) return id
  logger.error('Error reactivating default course rule:', error)
  if (isMissingCourseDefaultRulesInfrastructureError(error)) throwMissingCourseDefaultRulesMigrationError()
  throw new Error('No se pudo activar la regla predeterminada')
}

export async function createRule(params: ResolvedDefaultRuleParams) {
  const { data, error } = await fromLoose<CourseDefaultRuleRow>(
    createAdminClient(),
    'organization_course_default_rules',
  )
    .insert({
      organization_id: params.organizationId,
      course_id: params.courseId,
      scope_type: params.scopeType,
      node_id: params.scopeType === 'node' ? params.nodeId : null,
      include_descendants: params.includeDescendants,
      status: 'active',
      created_by: params.createdBy,
    })
    .select('id')
    .single()

  if (!error && data) return data.id
  logger.error('Error creating default course rule:', error)
  if (isMissingCourseDefaultRulesInfrastructureError(error)) throwMissingCourseDefaultRulesMigrationError()
  throw new Error('No se pudo crear la regla predeterminada')
}
