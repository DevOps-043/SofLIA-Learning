export interface BusinessLearningPathCourseSummary {
  id: string
  title: string
  slug: string | null
  thumbnail_url: string | null
  category: string | null
  level: string | null
}

export interface BusinessLearningPathItem {
  id: string
  learning_path_id: string
  course_id: string
  position: number
  course: BusinessLearningPathCourseSummary | null
}

export interface BusinessLearningPath {
  id: string
  title: string
  slug: string | null
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  items: BusinessLearningPathItem[]
  item_count: number
}

export interface BusinessLearningPathAssignment {
  id: string
  organization_id: string
  user_id: string
  learning_path_id: string
  assigned_at: string
  status: 'assigned' | 'revoked'
  assignment_source?: 'manual' | 'bulk' | 'default_rule'
  default_rule_id?: string | null
  learning_path: BusinessLearningPath | null
  user: {
    id: string
    email: string
    display_name: string | null
    first_name: string | null
    last_name: string | null
  } | null
}

export interface BusinessLearningPathDefaultRule {
  id: string
  organization_id: string
  learning_path_id: string
  scope_type: 'organization' | 'node'
  node_id: string | null
  include_descendants: boolean
  status: 'active' | 'revoked'
  created_at: string
  updated_at: string
  learning_path: BusinessLearningPath | null
  node: {
    id: string
    name: string
    type: string
    path: string
  } | null
}

export interface BusinessLearningPathHierarchyNode {
  id: string
  name: string
  type: string
  path: string
  parent_id: string | null
  depth: number
}

export type BusinessLearningPathAssignTarget =
  | { type: 'all' }
  | { type: 'node'; nodeIds: string[]; includeDescendants: boolean }

interface GetBusinessLearningPathsResponse {
  learningPaths: BusinessLearningPath[]
  assignments: BusinessLearningPathAssignment[]
  defaultRules: BusinessLearningPathDefaultRule[]
  hierarchyNodes: BusinessLearningPathHierarchyNode[]
}

async function readJsonResponse(response: Response, fallbackMessage: string) {
  const contentType = response.headers.get('content-type') || ''

  if (!contentType.includes('application/json')) {
    const text = await response.text().catch(() => '')
    throw new Error(text.includes('<!DOCTYPE') ? fallbackMessage : text || fallbackMessage)
  }

  return response.json()
}

export class BusinessLearningPathsService {
  static async getLearningPaths(
    orgSlug: string,
  ): Promise<GetBusinessLearningPathsResponse> {
    const response = await fetch(`/api/${orgSlug}/business/learning-paths`, {
      credentials: 'include',
    })
    const data = await readJsonResponse(response, 'Error al obtener rutas de aprendizaje')

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Error al obtener rutas de aprendizaje')
    }

    return {
      learningPaths: data.learningPaths || [],
      assignments: data.assignments || [],
      defaultRules: data.defaultRules || [],
      hierarchyNodes: data.hierarchyNodes || [],
    }
  }

  static async assignLearningPath(
    orgSlug: string,
    learningPathId: string,
    userIdsOrTarget: string[] | BusinessLearningPathAssignTarget,
  ) {
    const payload = Array.isArray(userIdsOrTarget)
      ? { learningPathId, userIds: userIdsOrTarget }
      : { learningPathId, target: userIdsOrTarget }

    const response = await fetch(`/api/${orgSlug}/business/learning-paths/assignments`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await readJsonResponse(response, 'Error al asignar la ruta de aprendizaje')

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Error al asignar la ruta de aprendizaje')
    }

    return data
  }

  static async createDefaultRule(
    orgSlug: string,
    payload: {
      learningPathId: string
      scopeType: 'organization' | 'node'
      nodeId?: string | null
      includeDescendants?: boolean
      applyNow?: boolean
    },
  ) {
    const response = await fetch(`/api/${orgSlug}/business/learning-paths/defaults`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await readJsonResponse(response, 'Error al configurar la ruta predeterminada')

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Error al configurar la ruta predeterminada')
    }

    return data
  }

  static async revokeDefaultRule(orgSlug: string, ruleId: string) {
    const response = await fetch(
      `/api/${orgSlug}/business/learning-paths/defaults?ruleId=${ruleId}`,
      {
        method: 'DELETE',
        credentials: 'include',
      },
    )
    const data = await readJsonResponse(response, 'Error al desactivar la ruta predeterminada')

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Error al desactivar la ruta predeterminada')
    }

    return data
  }

  static async applyDefaultRules(orgSlug: string, ruleIds?: string[]) {
    const response = await fetch(`/api/${orgSlug}/business/learning-paths/defaults/apply`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ruleIds }),
    })
    const data = await readJsonResponse(response, 'Error al aplicar rutas predeterminadas')

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Error al aplicar rutas predeterminadas')
    }

    return data
  }

  static async revokeLearningPathAssignment(orgSlug: string, assignmentId: string) {
    const response = await fetch(
      `/api/${orgSlug}/business/learning-paths/assignments?assignmentId=${assignmentId}`,
      {
        method: 'DELETE',
        credentials: 'include',
      },
    )
    const data = await readJsonResponse(response, 'Error al revocar la ruta de aprendizaje')

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Error al revocar la ruta de aprendizaje')
    }

    return data
  }
}
