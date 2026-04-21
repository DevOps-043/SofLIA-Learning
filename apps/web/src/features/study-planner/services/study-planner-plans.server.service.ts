import { createAdminClient } from '@/lib/supabase/admin'
import type {
  ListedStudyPlan,
  RawCourseRow,
  RawOrganizationMembershipRow,
  RawSessionRow,
  RawStudyPlan,
} from './study-planner-plans.types'
import {
  buildPlannedCourseKey,
  buildStudyPlannerDashboardDestination,
  extractOrganizationSlug,
  extractPlanCourseIds,
  extractSessionCourseIds,
} from './study-planner-plans.helpers'

export type { ListedStudyPlan } from './study-planner-plans.types'
export {
  buildPlannedCourseKey,
  buildStudyPlannerDashboardDestination,
  extractPlanCourseIds,
} from './study-planner-plans.helpers'

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
  const organizationIds = Array.from(
    new Set(
      plans
        .map((plan) => plan.organization_id)
        .filter((organizationId): organizationId is string =>
          typeof organizationId === 'string' && organizationId.trim() !== '',
        ),
    ),
  )

  const [{ data: rawCourses }, { data: rawSessions }, { data: rawMemberships }] = await Promise.all([
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
    organizationIds.length > 0
      ? supabase
          .from('organization_users')
          .select('organization_id, role, organizations!inner(slug)')
          .eq('user_id', userId)
          .eq('status', 'active')
          .in('organization_id', organizationIds)
      : Promise.resolve({ data: [] satisfies RawOrganizationMembershipRow[] }),
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

  const organizationContextById = new Map<
    string,
    {
      dashboardDestination: string
      organizationRole?: string
      organizationSlug: string
    }
  >()

  for (const membership of (rawMemberships || []) as RawOrganizationMembershipRow[]) {
    const organizationId = membership.organization_id
    const organizationSlug = extractOrganizationSlug(membership.organizations)

    if (!organizationId || !organizationSlug) {
      continue
    }

    const dashboardDestination = buildStudyPlannerDashboardDestination(
      organizationSlug,
      membership.role,
    )

    if (!dashboardDestination) {
      continue
    }

    organizationContextById.set(organizationId, {
      dashboardDestination,
      organizationRole: membership.role || undefined,
      organizationSlug,
    })
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
    const organizationContext = plan.organization_id
      ? organizationContextById.get(plan.organization_id)
      : undefined

    return {
      id: plan.id,
      name: plan.name,
      description: plan.description || undefined,
      startDate: plan.start_date || undefined,
      endDate: plan.end_date || undefined,
      timezone: plan.timezone || undefined,
      organizationId: plan.organization_id || undefined,
      organizationSlug: organizationContext?.organizationSlug,
      organizationRole: organizationContext?.organizationRole,
      dashboardDestination: organizationContext?.dashboardDestination,
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

export async function getUserPlannedCourseKeys(userId: string): Promise<Set<string>> {
  const plans = await listUserStudyPlans(userId)

  const keys = plans.flatMap((plan) =>
    plan.courseIds.map((courseId) => buildPlannedCourseKey(courseId, plan.organizationId)),
  )

  return new Set(keys)
}

export async function getUserPlannedCourseIds(userId: string): Promise<Set<string>> {
  const plans = await listUserStudyPlans(userId)
  return new Set(plans.flatMap((plan) => plan.courseIds))
}
