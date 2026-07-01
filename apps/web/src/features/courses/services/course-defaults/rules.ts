import { LearningPathDefaultsService } from '@/features/learning-paths/services/learning-path-defaults.server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import { getActiveCourseReference, loadCourseReferences } from './courses'
import {
  COURSE_DEFAULT_RULE_SELECT,
  isMissingCourseDefaultRulesInfrastructureError,
  throwMissingCourseDefaultRulesMigrationError,
} from './infrastructure'
import { mapCourseDefaultRule } from './mappers'
import { createRule, reactivateRule } from './rule-write'
import type { CourseDefaultRule, CourseDefaultRuleRow, CourseDefaultScopeType, OrganizationNodeRow } from './types'

export async function listDefaultRules(organizationId: string): Promise<CourseDefaultRule[]> {
  const supabase = createAdminClient()
  const { data, error } = await fromLoose<CourseDefaultRuleRow>(supabase, 'organization_course_default_rules')
    .select(COURSE_DEFAULT_RULE_SELECT)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Error loading course default rules:', error)
    if (isMissingCourseDefaultRulesInfrastructureError(error)) return []
    throw new Error('No se pudieron cargar las reglas predeterminadas')
  }

  const rows = data || []
  const [courseMap, nodes] = await Promise.all([
    loadCourseReferences([...new Set(rows.map((row) => row.course_id))]),
    LearningPathDefaultsService.listHierarchyNodeOptions(organizationId),
  ])
  const nodeMap = new Map<string, OrganizationNodeRow>(
    nodes.map((node) => [node.id, { id: node.id, organization_id: organizationId, name: node.name, type: node.type, path: node.path, parent_id: node.parent_id, is_active: true }]),
  )

  return rows.map((row) => mapCourseDefaultRule(row, courseMap, nodeMap))
}

export async function createOrReactivateDefaultRule(params: {
  organizationId: string
  courseId: string
  scopeType: CourseDefaultScopeType
  nodeId?: string | null
  includeDescendants?: boolean
  createdBy: string
}) {
  await validateDefaultRuleInput(params)
  const supabase = createAdminClient()
  const existingQuery = buildExistingRuleQuery(supabase, params)
  const existing = await existingQuery.maybeSingle()

  if (existing.error) {
    logger.error('Error checking default course rule:', existing.error)
    if (isMissingCourseDefaultRulesInfrastructureError(existing.error)) throwMissingCourseDefaultRulesMigrationError()
    throw new Error('No se pudo validar la regla predeterminada')
  }

  const resolvedParams = {
    organizationId: params.organizationId,
    courseId: params.courseId,
    scopeType: params.scopeType,
    nodeId: params.nodeId ?? null,
    includeDescendants: params.includeDescendants ?? true,
    createdBy: params.createdBy,
  }

  return existing.data ? reactivateRule(existing.data.id, resolvedParams) : createRule(resolvedParams)
}

async function validateDefaultRuleInput(params: {
  organizationId: string
  courseId: string
  scopeType: CourseDefaultScopeType
  nodeId?: string | null
}) {
  const course = await getActiveCourseReference(params.courseId)
  if (!course) throw new Error('El curso no esta disponible')
  if (params.scopeType !== 'node') return

  if (!params.nodeId) throw new Error('Selecciona un nodo para la regla predeterminada')
  const nodes = await LearningPathDefaultsService.listHierarchyNodeOptions(params.organizationId)
  if (!nodes.some((node) => node.id === params.nodeId)) throw new Error('El nodo seleccionado no pertenece a la organizacion')
}

function buildExistingRuleQuery(
  supabase: ReturnType<typeof createAdminClient>,
  params: { organizationId: string; courseId: string; scopeType: CourseDefaultScopeType; nodeId?: string | null },
) {
  const query = fromLoose<CourseDefaultRuleRow>(supabase, 'organization_course_default_rules')
    .select(COURSE_DEFAULT_RULE_SELECT)
    .eq('organization_id', params.organizationId)
    .eq('course_id', params.courseId)
    .eq('scope_type', params.scopeType)
  return params.scopeType === 'organization' ? query.is('node_id', null) : query.eq('node_id', params.nodeId || '')
}
