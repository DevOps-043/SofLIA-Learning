import {
  deleteBusinessLearningPathResource,
  getBusinessLearningPathResource,
  postBusinessLearningPathResource,
} from './business-learning-paths/business-learning-paths-http.service'
import type {
  BusinessLearningPath,
  BusinessLearningPathAssignment,
} from './business-learning-paths/business-learning-paths.types'
import type {
  BusinessLearningPathAssignTarget,
  BusinessLearningPathDefaultRule,
  BusinessLearningPathDefaultRulePayload,
  BusinessLearningPathHierarchyNode,
  GetBusinessLearningPathsResponse,
} from './business-learning-paths/business-learning-paths-more.types'

export type * from './business-learning-paths/business-learning-paths.types'
export type * from './business-learning-paths/business-learning-paths-more.types'

function arrayOrEmpty<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

export class BusinessLearningPathsService {
  static getLearningPaths(orgSlug: string): Promise<GetBusinessLearningPathsResponse> {
    return getBusinessLearningPathResource(
      `/api/${orgSlug}/business/learning-paths`,
      'Error al obtener rutas de aprendizaje',
      (data) => ({
        learningPaths: arrayOrEmpty<BusinessLearningPath>(data.learningPaths),
        assignments: arrayOrEmpty<BusinessLearningPathAssignment>(data.assignments),
        defaultRules: arrayOrEmpty<BusinessLearningPathDefaultRule>(data.defaultRules),
        hierarchyNodes: arrayOrEmpty<BusinessLearningPathHierarchyNode>(data.hierarchyNodes),
      }),
    )
  }

  static assignLearningPath(
    orgSlug: string,
    learningPathId: string,
    userIdsOrTarget: string[] | BusinessLearningPathAssignTarget,
  ) {
    const payload = Array.isArray(userIdsOrTarget)
      ? { learningPathId, userIds: userIdsOrTarget }
      : { learningPathId, target: userIdsOrTarget }

    return postBusinessLearningPathResource(
      `/api/${orgSlug}/business/learning-paths/assignments`,
      payload,
      'Error al asignar la ruta de aprendizaje',
    )
  }

  static createDefaultRule(
    orgSlug: string,
    payload: BusinessLearningPathDefaultRulePayload,
  ) {
    return postBusinessLearningPathResource(
      `/api/${orgSlug}/business/learning-paths/defaults`,
      payload,
      'Error al configurar la ruta predeterminada',
    )
  }

  static revokeDefaultRule(orgSlug: string, ruleId: string) {
    return deleteBusinessLearningPathResource(
      `/api/${orgSlug}/business/learning-paths/defaults?ruleId=${ruleId}`,
      'Error al desactivar la ruta predeterminada',
    )
  }

  static applyDefaultRules(orgSlug: string, ruleIds?: string[]) {
    return postBusinessLearningPathResource(
      `/api/${orgSlug}/business/learning-paths/defaults/apply`,
      { ruleIds },
      'Error al aplicar rutas predeterminadas',
    )
  }

  static revokeLearningPathAssignment(orgSlug: string, assignmentId: string) {
    return deleteBusinessLearningPathResource(
      `/api/${orgSlug}/business/learning-paths/assignments?assignmentId=${assignmentId}`,
      'Error al revocar la ruta de aprendizaje',
    )
  }

  static forceRevokeKeptCourses(orgSlug: string, userId: string, courseIds: string[]) {
    return postBusinessLearningPathResource(
      `/api/${orgSlug}/business/course-access/force-revoke`,
      { userId, courseIds },
      'Error al revocar el acceso a los cursos seleccionados',
    )
  }
}
