import {
  deleteBusinessLearningPathResource,
  getBusinessLearningPathResource,
  postBusinessLearningPathResource,
} from './business-learning-paths/business-learning-paths-http.service'
import type {
  BusinessCourseDefaultRule,
  BusinessCourseDefaultRulePayload,
  GetBusinessCourseDefaultsResponse,
} from './business-course-defaults/business-course-defaults.types'
import type { BusinessLearningPathHierarchyNode } from './business-learning-paths/business-learning-paths-more.types'

export type * from './business-course-defaults/business-course-defaults.types'

function arrayOrEmpty<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

export class BusinessCourseDefaultsService {
  static getCourseDefaults(orgSlug: string): Promise<GetBusinessCourseDefaultsResponse> {
    return getBusinessLearningPathResource(
      `/api/${orgSlug}/business/courses/defaults`,
      'Error al obtener cursos predeterminados',
      (data) => ({
        rules: arrayOrEmpty<BusinessCourseDefaultRule>(data.rules),
        nodes: arrayOrEmpty<BusinessLearningPathHierarchyNode>(data.nodes),
      }),
    )
  }

  static createDefaultRule(orgSlug: string, payload: BusinessCourseDefaultRulePayload) {
    return postBusinessLearningPathResource(
      `/api/${orgSlug}/business/courses/defaults`,
      payload,
      'Error al configurar el curso predeterminado',
    )
  }

  static revokeDefaultRule(orgSlug: string, ruleId: string) {
    return deleteBusinessLearningPathResource(
      `/api/${orgSlug}/business/courses/defaults?ruleId=${ruleId}`,
      'Error al desactivar el curso predeterminado',
    )
  }

  static applyDefaultRules(orgSlug: string, ruleIds?: string[]) {
    return postBusinessLearningPathResource(
      `/api/${orgSlug}/business/courses/defaults/apply`,
      { ruleIds },
      'Error al aplicar cursos predeterminados',
    )
  }
}
