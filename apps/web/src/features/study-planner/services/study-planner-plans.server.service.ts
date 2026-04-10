import { createAdminClient } from '@/lib/supabase/admin'

interface RawStudyPlan {
  ai_generation_metadata?: {
    courseIds?: unknown
  } | null
  created_at?: string | null
  description?: string | null
  end_date?: string | null
  id: string
  name: string
  organization_id?: string | null
  start_date?: string | null
  timezone?: string | null
  updated_at?: string | null
}

interface RawCourseRow {
  id: string
  title: string | null
}

interface RawSessionRow {
  course_id: string | null
  id: string
  metrics?: {
    plannedCourseId?: unknown
    plannedLessons?: Array<{ courseId?: unknown }> | unknown
  } | null
  plan_id: string | null
  start_time: string
  status: string
}

export interface ListedStudyPlan {
  id: string
  name: string
  description?: string
  startDate?: string
  endDate?: string
  timezone?: string
  createdAt?: string
  updatedAt?: string
  courseIds: string[]
  /** Organization that owns this plan. Undefined for B2C plans. */
  organizationId?: string
  primaryCourseId?: string
  primaryCourseTitle?: string
  totalSessions: number
  completedSessions: number
  upcomingSessions: number
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

function extractSessionCourseIds(session: RawSessionRow): string[] {
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

/**
 * Builds a composite key that uniquely identifies a planned (course, organization) pair.
 * For B2C plans (no org), the key is just the courseId.
 * This prevents the same course planned for two different organizations from
 * blocking each other.
 */
export function buildPlannedCourseKey(courseId: string, organizationId?: string | null): string {
  return organizationId ? `${courseId}::${organizationId}` : courseId
}

export async function listUserStudyPlans(
  userId: string,
): Promise<ListedStudyPlan[]> {
  const supabase = createAdminClient()

  const { data: rawPlans, error: plansError } = await supabase
    .from('study_plans')
    .select(
      'id, name, description, start_date, end_date, timezone, organization_id, created_at, updated_at, ai_generation_metadata',
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (plansError) {
    throw plansError
  }

  const plans = (rawPlans || []) as RawStudyPlan[]

  if (plans.length === 0) {
    return []
  }

  const allCourseIds = Array.from(
    new Set(plans.flatMap((plan) => extractPlanCourseIds(plan.ai_generation_metadata))),
  )

  const allPlanIds = plans.map((plan) => plan.id)

  const [{ data: rawCourses }, { data: rawSessions }] = await Promise.all([
    allCourseIds.length > 0
      ? supabase
          .from('courses')
          .select('id, title')
          .in('id', allCourseIds)
      : Promise.resolve({ data: [] satisfies RawCourseRow[] }),
    supabase
      .from('study_sessions')
      .select('id, plan_id, start_time, status, course_id, metrics')
      .in('plan_id', allPlanIds),
  ])

  const courseTitleById = new Map(
    ((rawCourses || []) as RawCourseRow[]).map((course) => [
      course.id,
      course.title || 'Curso',
    ]),
  )

  const sessionsByPlanId = new Map<string, RawSessionRow[]>()
  for (const session of (rawSessions || []) as RawSessionRow[]) {
    if (!session.plan_id) {
      continue
    }

    const planSessions = sessionsByPlanId.get(session.plan_id) || []
    planSessions.push(session)
    sessionsByPlanId.set(session.plan_id, planSessions)
  }

  const now = Date.now()

  return plans.map((plan) => {
    const planSessions = sessionsByPlanId.get(plan.id) || []
    const courseIds = Array.from(
      new Set([
        ...extractPlanCourseIds(plan.ai_generation_metadata),
        ...planSessions.flatMap((session) => extractSessionCourseIds(session)),
      ]),
    )
    const primaryCourseId = courseIds[0]

    return {
      id: plan.id,
      name: plan.name,
      description: plan.description || undefined,
      startDate: plan.start_date || undefined,
      endDate: plan.end_date || undefined,
      timezone: plan.timezone || undefined,
      organizationId: plan.organization_id || undefined,
      createdAt: plan.created_at || undefined,
      updatedAt: plan.updated_at || undefined,
      courseIds,
      primaryCourseId,
      primaryCourseTitle: primaryCourseId
        ? courseTitleById.get(primaryCourseId)
        : undefined,
      totalSessions: planSessions.length,
      completedSessions: planSessions.filter(
        (session) => session.status === 'completed',
      ).length,
      upcomingSessions: planSessions.filter(
        (session) =>
          session.status === 'planned'
          && new Date(session.start_time).getTime() > now,
      ).length,
    }
  })
}

export async function getUserStudyPlanByIdOrLatest(params: {
  planId?: string
  userId: string
}): Promise<ListedStudyPlan | null> {
  const plans = await listUserStudyPlans(params.userId)

  if (!params.planId) {
    return plans[0] || null
  }

  return plans.find((plan) => plan.id === params.planId) || null
}

/**
 * Returns a Set of composite keys ("courseId::orgId" for B2B, "courseId" for B2C)
 * representing all (course, organization) pairs that already have an active plan.
 *
 * Using a composite key prevents blocking a second plan for the same course
 * when the user belongs to two different organizations that both assigned it.
 */
export async function getUserPlannedCourseKeys(userId: string): Promise<Set<string>> {
  const plans = await listUserStudyPlans(userId)

  const keys = plans.flatMap((plan) =>
    plan.courseIds.map((courseId) => buildPlannedCourseKey(courseId, plan.organizationId)),
  )

  return new Set(keys)
}

/**
 * @deprecated Use getUserPlannedCourseKeys for multi-org aware duplicate detection.
 * Kept for backwards compatibility with callers that only need courseId-based lookup.
 */
export async function getUserPlannedCourseIds(userId: string): Promise<Set<string>> {
  const plans = await listUserStudyPlans(userId)
  return new Set(plans.flatMap((plan) => plan.courseIds))
}
