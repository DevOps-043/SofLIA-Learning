// Client-side service for the super-admin "default content" controls in the
// company edit → Courses tab. It calls the admin API routes which are keyed by
// company id (the organization id) and reuse the same server services as the
// business panel (CourseDefaultsService / LearningPathDefaultsService).

export type DefaultScopeType = 'organization' | 'node'

export interface AdminHierarchyNode {
  id: string
  name: string
  type: string
  depth: number
}

export interface AdminContentDefaultRule {
  id: string
  scope_type: DefaultScopeType
  node_id: string | null
  include_descendants: boolean
  status: 'active' | 'revoked'
  /** Present on course rules */
  course_id?: string
  /** Present on learning-path rules */
  learning_path_id?: string
  node: { id: string; name: string; type: string } | null
}

export interface DefaultRulesResponse {
  rules: AdminContentDefaultRule[]
  nodes: AdminHierarchyNode[]
}

export interface CreateDefaultRulePayload {
  scopeType: DefaultScopeType
  nodeId?: string | null
  includeDescendants?: boolean
  applyNow?: boolean
}

async function parseOrThrow(res: Response, fallbackMessage: string) {
  const data = await res.json().catch(() => null)
  if (!res.ok || !data?.success) {
    throw new Error(data?.error || fallbackMessage)
  }
  return data
}

function arrayOrEmpty<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

async function getDefaults(basePath: string, fallbackMessage: string): Promise<DefaultRulesResponse> {
  const res = await fetch(basePath)
  const data = await parseOrThrow(res, fallbackMessage)
  return {
    rules: arrayOrEmpty<AdminContentDefaultRule>(data.rules),
    nodes: arrayOrEmpty<AdminHierarchyNode>(data.nodes),
  }
}

async function createRule(basePath: string, body: Record<string, unknown>, fallbackMessage: string) {
  const res = await fetch(basePath, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return parseOrThrow(res, fallbackMessage)
}

async function revokeRule(basePath: string, ruleId: string, fallbackMessage: string) {
  const res = await fetch(`${basePath}?ruleId=${ruleId}`, { method: 'DELETE' })
  return parseOrThrow(res, fallbackMessage)
}

async function applyRules(basePath: string, ruleIds: string[] | undefined, fallbackMessage: string) {
  const res = await fetch(`${basePath}/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ruleIds }),
  })
  return parseOrThrow(res, fallbackMessage)
}

export const AdminContentDefaultsService = {
  // Courses
  getCourseDefaults(companyId: string) {
    return getDefaults(
      `/api/admin/companies/${companyId}/course-defaults`,
      'Error al obtener cursos predeterminados',
    )
  },
  createCourseDefaultRule(companyId: string, courseId: string, payload: CreateDefaultRulePayload) {
    return createRule(
      `/api/admin/companies/${companyId}/course-defaults`,
      { courseId, ...payload },
      'Error al configurar el curso predeterminado',
    )
  },
  revokeCourseDefaultRule(companyId: string, ruleId: string) {
    return revokeRule(
      `/api/admin/companies/${companyId}/course-defaults`,
      ruleId,
      'Error al desactivar el curso predeterminado',
    )
  },
  applyCourseDefaultRules(companyId: string, ruleIds?: string[]) {
    return applyRules(
      `/api/admin/companies/${companyId}/course-defaults`,
      ruleIds,
      'Error al aplicar cursos predeterminados',
    )
  },

  // Learning paths
  getLearningPathDefaults(companyId: string) {
    return getDefaults(
      `/api/admin/companies/${companyId}/learning-path-defaults`,
      'Error al obtener rutas predeterminadas',
    )
  },
  createLearningPathDefaultRule(companyId: string, learningPathId: string, payload: CreateDefaultRulePayload) {
    return createRule(
      `/api/admin/companies/${companyId}/learning-path-defaults`,
      { learningPathId, ...payload },
      'Error al configurar la ruta predeterminada',
    )
  },
  revokeLearningPathDefaultRule(companyId: string, ruleId: string) {
    return revokeRule(
      `/api/admin/companies/${companyId}/learning-path-defaults`,
      ruleId,
      'Error al desactivar la ruta predeterminada',
    )
  },
  applyLearningPathDefaultRules(companyId: string, ruleIds?: string[]) {
    return applyRules(
      `/api/admin/companies/${companyId}/learning-path-defaults`,
      ruleIds,
      'Error al aplicar rutas predeterminadas',
    )
  },
}
