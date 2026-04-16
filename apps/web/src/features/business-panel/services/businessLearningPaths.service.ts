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
  learning_path: BusinessLearningPath | null
  user: {
    id: string
    email: string
    display_name: string | null
    first_name: string | null
    last_name: string | null
  } | null
}

interface GetBusinessLearningPathsResponse {
  learningPaths: BusinessLearningPath[]
  assignments: BusinessLearningPathAssignment[]
}

export class BusinessLearningPathsService {
  static async getLearningPaths(
    orgSlug: string,
  ): Promise<GetBusinessLearningPathsResponse> {
    const response = await fetch(`/api/${orgSlug}/business/learning-paths`, {
      credentials: 'include',
    })
    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Error al obtener rutas de aprendizaje')
    }

    return {
      learningPaths: data.learningPaths || [],
      assignments: data.assignments || [],
    }
  }

  static async assignLearningPath(
    orgSlug: string,
    learningPathId: string,
    userIds: string[],
  ) {
    const response = await fetch(`/api/${orgSlug}/business/learning-paths/assignments`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        learningPathId,
        userIds,
      }),
    })
    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Error al asignar la ruta de aprendizaje')
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
    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Error al revocar la ruta de aprendizaje')
    }

    return data
  }
}
