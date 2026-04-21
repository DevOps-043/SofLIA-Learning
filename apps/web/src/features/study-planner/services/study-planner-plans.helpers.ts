import type { RawSessionRow, RawStudyPlan } from './study-planner-plans.types';

interface OrganizationRelation {
  slug?: string | null
}

export function extractPlanCourseIds(
  aiGenerationMetadata: RawStudyPlan['ai_generation_metadata'],
): string[] {
  const rawCourseIds = aiGenerationMetadata?.courseIds

  if (!Array.isArray(rawCourseIds)) {
    return []
  }

  return rawCourseIds.filter(
    (courseId): courseId is string =>
      typeof courseId === 'string' && courseId.trim().length > 0,
  )
}

export function extractSessionCourseIds(session: RawSessionRow): string[] {
  const courseIds = new Set<string>()

  if (typeof session.course_id === 'string' && session.course_id.trim().length > 0) {
    courseIds.add(session.course_id)
  }

  if (
    typeof session.metrics?.plannedCourseId === 'string'
    && session.metrics.plannedCourseId.trim().length > 0
  ) {
    courseIds.add(session.metrics.plannedCourseId)
  }

  if (Array.isArray(session.metrics?.plannedLessons)) {
    for (const lesson of session.metrics.plannedLessons) {
      if (
        lesson
        && typeof lesson === 'object'
        && typeof lesson.courseId === 'string'
        && lesson.courseId.trim().length > 0
      ) {
        courseIds.add(lesson.courseId)
      }
    }
  }

  return Array.from(courseIds)
}

export function buildPlannedCourseKey(courseId: string, organizationId?: string | null): string {
  return organizationId ? `${courseId}::${organizationId}` : courseId
}

export function buildStudyPlannerDashboardDestination(
  organizationSlug?: string | null,
  organizationRole?: string | null,
): string | undefined {
  if (!organizationSlug) {
    return undefined
  }

  if (organizationRole === 'owner' || organizationRole === 'admin') {
    return `/${organizationSlug}/business-panel/dashboard`
  }

  return `/${organizationSlug}/business-user/dashboard`
}

export function extractOrganizationSlug(organization: unknown): string | undefined {
  if (!organization) {
    return undefined
  }

  const relation = Array.isArray(organization)
    ? organization[0]
    : organization

  if (!relation || typeof relation !== 'object') {
    return undefined
  }

  const organizationRelation = relation as OrganizationRelation

  return typeof organizationRelation.slug === 'string'
    ? organizationRelation.slug
    : undefined
}
