import type { createAdminClient } from '@/lib/supabase/admin'
import {
  canUseCourseEnrollmentScope,
  ensureCourseEnrollmentScope,
  resolveCourseEnrollment,
} from './course-enrollment.server.service'

type SupabaseAdminClient = ReturnType<typeof createAdminClient>

type CourseRow = {
  id: string
  title: string | null
}

type OrganizationRow = {
  id: string
  name: string
  slug: string
}

export type LegacyProgressCandidate = {
  enrollmentId: string | null
  hasEnrollment: boolean
  organizationId: string
  organizationName: string
  organizationSlug: string
  progressPercentage: number
}

export type LegacyProgressSummary = {
  activitySubmissionsCount: number
  enrollmentId: string | null
  hasLegacyData: boolean
  notesCount: number
  progressPercentage: number
  progressRowsCount: number
  quizSubmissionsCount: number
  trackingRowsCount: number
}

export type LegacyProgressResolution = {
  candidates: LegacyProgressCandidate[]
  course: CourseRow
  legacy: LegacyProgressSummary
  requiresSelection: boolean
}

type ClaimLegacyProgressResult = {
  redirectPath: string
  targetEnrollmentId: string
  targetOrganizationId: string
  targetOrganizationSlug: string
}

type RpcClient = {
  rpc: (
    functionName: 'claim_legacy_course_progress',
    args: {
      p_claimed_by: string
      p_course_id: string
      p_target_organization_id: string
      p_user_id: string
    },
  ) => Promise<{ data: unknown; error: { message?: string } | null }>
}

type LegacyEnrollmentFilterableQuery = {
  is: (column: string, value: null) => unknown
  or: (filters: string) => unknown
}

async function loadCourseBySlug(
  supabase: SupabaseAdminClient,
  slug: string,
): Promise<CourseRow | null> {
  const { data } = await supabase
    .from('courses')
    .select('id, title')
    .eq('slug', slug)
    .maybeSingle()

  return (data || null) as CourseRow | null
}

async function loadCourseLessonIds(
  supabase: SupabaseAdminClient,
  courseId: string,
) {
  const { data } = await supabase
    .from('course_lessons')
    .select('lesson_id, course_modules!inner(course_id)')
    .eq('course_modules.course_id', courseId)

  return (data || [])
    .map((row) => row.lesson_id)
    .filter((lessonId): lessonId is string => Boolean(lessonId))
}

async function countRows(
  query: PromiseLike<{ count?: number | null }>,
) {
  const result = await query
  return result.count || 0
}

function applyLegacyEnrollmentFilter<T extends LegacyEnrollmentFilterableQuery>(
  query: T,
  legacyEnrollmentId: string | null,
) {
  if (!legacyEnrollmentId) {
    return query.is('enrollment_id', null) as T
  }

  return query.or(`enrollment_id.is.null,enrollment_id.eq.${legacyEnrollmentId}`) as T
}

async function countLegacyRowsForLessons({
  legacyEnrollmentId,
  lessonIds,
  supabase,
  userId,
}: {
  legacyEnrollmentId: string | null
  lessonIds: string[]
  supabase: SupabaseAdminClient
  userId: string
}) {
  if (lessonIds.length === 0) {
    return {
      notesCount: 0,
      progressRowsCount: 0,
      quizSubmissionsCount: 0,
      trackingRowsCount: 0,
    }
  }

  const notesQuery = applyLegacyEnrollmentFilter(
    supabase
      .from('user_lesson_notes')
      .select('note_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('organization_id', null)
      .in('lesson_id', lessonIds),
    legacyEnrollmentId,
  )

  const progressQuery = legacyEnrollmentId
    ? supabase
        .from('user_lesson_progress')
        .select('progress_id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('enrollment_id', legacyEnrollmentId)
        .is('organization_id', null)
        .in('lesson_id', lessonIds)
    : Promise.resolve({ count: 0 })

  const quizQuery = applyLegacyEnrollmentFilter(
    supabase
      .from('user_quiz_submissions')
      .select('submission_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('organization_id', null)
      .in('lesson_id', lessonIds),
    legacyEnrollmentId,
  )

  const trackingQuery = applyLegacyEnrollmentFilter(
    supabase
      .from('lesson_tracking')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('organization_id', null)
      .in('lesson_id', lessonIds),
    legacyEnrollmentId,
  )

  const [notesCount, progressRowsCount, quizSubmissionsCount, trackingRowsCount] =
    await Promise.all([
      countRows(notesQuery),
      countRows(progressQuery),
      countRows(quizQuery),
      countRows(trackingQuery),
    ])

  return {
    notesCount,
    progressRowsCount,
    quizSubmissionsCount,
    trackingRowsCount,
  }
}

async function countLegacyActivitySubmissions({
  courseId,
  legacyEnrollmentId,
  supabase,
  userId,
}: {
  courseId: string
  legacyEnrollmentId: string | null
  supabase: SupabaseAdminClient
  userId: string
}) {
  const query = applyLegacyEnrollmentFilter(
    supabase
      .from('user_activity_submissions')
      .select('submission_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .is('organization_id', null),
    legacyEnrollmentId,
  )

  return countRows(query)
}

async function loadCandidateOrganizations(
  supabase: SupabaseAdminClient,
  userId: string,
) {
  const { data: memberships } = await supabase
    .from('organization_users')
    .select('organization_id')
    .eq('user_id', userId)
    .eq('status', 'active')

  const organizationIds = [
    ...new Set(
      (memberships || [])
        .map((membership) => membership.organization_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ]

  if (organizationIds.length === 0) {
    return []
  }

  const { data: organizations } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .in('id', organizationIds)

  return ((organizations || []) as OrganizationRow[]).filter(
    (organization) => Boolean(organization.slug),
  )
}

async function buildCandidates({
  courseId,
  supabase,
  userId,
}: {
  courseId: string
  supabase: SupabaseAdminClient
  userId: string
}): Promise<LegacyProgressCandidate[]> {
  const organizations = await loadCandidateOrganizations(supabase, userId)
  const candidates = await Promise.all(
    organizations.map(async (organization) => {
      const canUseScope = await canUseCourseEnrollmentScope(
        supabase,
        userId,
        courseId,
        organization.id,
      )

      if (!canUseScope) {
        return null
      }

      const enrollment = await resolveCourseEnrollment(
        supabase,
        userId,
        courseId,
        organization.id,
      )

      return {
        enrollmentId: enrollment?.enrollment_id || null,
        hasEnrollment: Boolean(enrollment),
        organizationId: organization.id,
        organizationName: organization.name,
        organizationSlug: organization.slug,
        progressPercentage: enrollment?.overall_progress_percentage || 0,
      }
    }),
  )

  return candidates
    .filter((candidate): candidate is LegacyProgressCandidate => Boolean(candidate))
    .sort((left, right) =>
      left.organizationName.localeCompare(right.organizationName),
    )
}

export async function getLegacyProgressResolution({
  slug,
  supabase,
  userId,
}: {
  slug: string
  supabase: SupabaseAdminClient
  userId: string
}): Promise<LegacyProgressResolution | null> {
  const course = await loadCourseBySlug(supabase, slug)

  if (!course) {
    return null
  }

  const [legacyEnrollment, lessonIds, candidates] = await Promise.all([
    resolveCourseEnrollment(supabase, userId, course.id, null),
    loadCourseLessonIds(supabase, course.id),
    buildCandidates({ courseId: course.id, supabase, userId }),
  ])

  const legacyEnrollmentId = legacyEnrollment?.enrollment_id || null
  const [
    legacyLessonCounts,
    activitySubmissionsCount,
  ] = await Promise.all([
    countLegacyRowsForLessons({
      legacyEnrollmentId,
      lessonIds,
      supabase,
      userId,
    }),
    countLegacyActivitySubmissions({
      courseId: course.id,
      legacyEnrollmentId,
      supabase,
      userId,
    }).catch(() => 0),
  ])
  const hasLegacyData =
    Boolean(legacyEnrollmentId) ||
    legacyLessonCounts.notesCount > 0 ||
    legacyLessonCounts.progressRowsCount > 0 ||
    legacyLessonCounts.quizSubmissionsCount > 0 ||
    legacyLessonCounts.trackingRowsCount > 0 ||
    activitySubmissionsCount > 0

  return {
    candidates,
    course,
    legacy: {
      ...legacyLessonCounts,
      activitySubmissionsCount,
      enrollmentId: legacyEnrollmentId,
      hasLegacyData,
      progressPercentage: legacyEnrollment?.overall_progress_percentage || 0,
    },
    requiresSelection: candidates.length > 0,
  }
}

export async function claimLegacyProgressForOrganization({
  organizationId,
  slug,
  supabase,
  userId,
}: {
  organizationId: string
  slug: string
  supabase: SupabaseAdminClient
  userId: string
}): Promise<ClaimLegacyProgressResult | null> {
  const resolution = await getLegacyProgressResolution({ slug, supabase, userId })

  if (!resolution) {
    return null
  }

  const candidate = resolution.candidates.find(
    (item) => item.organizationId === organizationId,
  )

  if (!candidate) {
    return null
  }

  if (!resolution.legacy.hasLegacyData) {
    const enrollment = await ensureCourseEnrollmentScope(
      supabase,
      userId,
      resolution.course.id,
      organizationId,
    )

    if (!enrollment) {
      return null
    }

    return {
      redirectPath: `/${candidate.organizationSlug}/courses/${slug}/learn`,
      targetEnrollmentId: enrollment.enrollment_id,
      targetOrganizationId: organizationId,
      targetOrganizationSlug: candidate.organizationSlug,
    }
  }

  const { data, error } = await (supabase as unknown as RpcClient).rpc(
    'claim_legacy_course_progress',
    {
      p_claimed_by: userId,
      p_course_id: resolution.course.id,
      p_target_organization_id: organizationId,
      p_user_id: userId,
    },
  )

  if (error) {
    throw new Error(error.message || 'LEGACY_PROGRESS_CLAIM_FAILED')
  }

  const rpcResult = (data || {}) as {
    targetEnrollmentId?: string
    targetOrganizationId?: string
  }

  return {
    redirectPath: `/${candidate.organizationSlug}/courses/${slug}/learn`,
    targetEnrollmentId: rpcResult.targetEnrollmentId || candidate.enrollmentId || '',
    targetOrganizationId: rpcResult.targetOrganizationId || organizationId,
    targetOrganizationSlug: candidate.organizationSlug,
  }
}
