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
  start_date?: string | null
  timezone?: string | null
  updated_at?: string | null
}

interface RawCourseRow {
  id: string
  title: string | null
}

interface RawSessionRow {
  id: string
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

export async function listUserStudyPlans(
  userId: string,
): Promise<ListedStudyPlan[]> {
  const supabase = createAdminClient()

  const { data: rawPlans, error: plansError } = await supabase
    .from('study_plans')
    .select(
      'id, name, description, start_date, end_date, timezone, created_at, updated_at, ai_generation_metadata',
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
      .select('id, plan_id, start_time, status')
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
    const courseIds = extractPlanCourseIds(plan.ai_generation_metadata)
    const primaryCourseId = courseIds[0]
    const planSessions = sessionsByPlanId.get(plan.id) || []

    return {
      id: plan.id,
      name: plan.name,
      description: plan.description || undefined,
      startDate: plan.start_date || undefined,
      endDate: plan.end_date || undefined,
      timezone: plan.timezone || undefined,
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

export async function getUserPlannedCourseIds(
  userId: string,
): Promise<Set<string>> {
  const plans = await listUserStudyPlans(userId)

  return new Set(plans.flatMap((plan) => plan.courseIds))
}
