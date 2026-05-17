import type {
  HierarchyAnalytics,
  HierarchyCourse,
} from '../../../types/hierarchy.types'
import { fetchApi } from './hierarchy-api'
import type {
  ApiResponse,
  AssignCoursesToEntityOptions,
  AssignCoursesToEntityResponse,
  HierarchyEntityType,
} from './hierarchy-common.types'

export async function getVisualAnalytics(
  entityType: HierarchyEntityType,
  entityId: string,
  orgSlug?: string,
): Promise<HierarchyAnalytics | null> {
  const result = await fetchApi<{ analytics: HierarchyAnalytics }>(
    `/analytics?type=${entityType}&id=${entityId}`,
    {},
    orgSlug,
  )
  return result.success ? result.data?.analytics ?? null : null
}

export async function getEntityCourses(
  entityType: HierarchyEntityType,
  entityId: string,
  orgSlug?: string,
): Promise<HierarchyCourse[]> {
  const result = await fetchApi<{ courses: HierarchyCourse[] }>(
    `/courses?type=${entityType}&id=${entityId}`,
    {},
    orgSlug,
  )
  return result.success ? result.data?.courses ?? [] : []
}

export async function getEntityAssignments(
  entityType: HierarchyEntityType,
  entityId: string,
  orgSlug?: string,
) {
  const { HierarchyAssignmentsService } = await import('../../hierarchy-assignments.service')
  return HierarchyAssignmentsService.getEntityAssignments(entityType, entityId, orgSlug)
}

export function assignCoursesToEntity(
  entityType: HierarchyEntityType,
  entityId: string,
  courseIds: string[],
  options?: AssignCoursesToEntityOptions,
  orgSlug?: string,
): Promise<ApiResponse<AssignCoursesToEntityResponse>> {
  return fetchApi('/courses/assign', {
    method: 'POST',
    body: JSON.stringify({
      entity_type: entityType,
      entity_id: entityId,
      course_ids: courseIds,
      ...options,
    }),
  }, orgSlug)
}
