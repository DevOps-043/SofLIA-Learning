import { createClient } from '../../../../lib/supabase/server'
import { createEmptyUserStats } from '../profile.shared'

interface UserProfileStatsRpcRow {
  completed_courses: number | string | null
  completed_lessons: number | string | null
  certificates: number | string | null
  courses_in_progress: number | string | null
}

interface UserProfileStatsRpcClient {
  rpc(
    fn: 'get_user_profile_stats',
    args: { p_user_id: string },
  ): PromiseLike<{
    data: UserProfileStatsRpcRow[] | UserProfileStatsRpcRow | null
    error: { message?: string } | null
  }>
}

function toCount(value: number | string | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function mapRpcStats(row: UserProfileStatsRpcRow) {
  return {
    completedCourses: toCount(row.completed_courses),
    completedLessons: toCount(row.completed_lessons),
    certificates: toCount(row.certificates),
    coursesInProgress: toCount(row.courses_in_progress),
  }
}

export async function getUserStats(userId: string): Promise<{
  completedCourses: number
  completedLessons: number
  certificates: number
  coursesInProgress: number
}> {
  try {
    const supabase = await createClient()
    return getGlobalUserStats(supabase, userId)
  } catch {
    return createEmptyUserStats()
  }
}

export async function getOrganizationUserStats(
  userId: string,
  organizationId: string,
): Promise<{
  completedCourses: number
  completedLessons: number
  certificates: number
  coursesInProgress: number
}> {
  try {
    const supabase = await createClient()
    const [enrollmentsResult, assignmentsResult, certificatesResult] = await Promise.all([
      supabase
        .from('user_course_enrollments')
        .select('course_id, enrollment_status')
        .eq('user_id', userId)
        .eq('organization_id', organizationId),
      supabase
        .from('organization_course_assignments')
        .select('course_id')
        .eq('user_id', userId)
        .eq('organization_id', organizationId),
      supabase
        .from('user_course_certificates')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('organization_id', organizationId),
    ])

    const enrollments = enrollmentsResult.data || []
    const assignmentCourseIds = (assignmentsResult.data || []).map((assignment) => assignment.course_id)
    const courseIds = Array.from(new Set([
      ...enrollments.map((enrollment) => enrollment.course_id),
      ...assignmentCourseIds,
    ]))
    const completedLessons = await countCompletedLessonsForCourses(supabase, userId, courseIds)

    return {
      completedCourses: enrollments.filter((enrollment) => enrollment.enrollment_status === 'completed').length,
      completedLessons,
      certificates: certificatesResult.count || 0,
      coursesInProgress: enrollments.filter((enrollment) => enrollment.enrollment_status === 'active').length,
    }
  } catch {
    return createEmptyUserStats()
  }
}

async function getGlobalUserStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data: rpcData, error: rpcError } = await (
    supabase as unknown as UserProfileStatsRpcClient
  ).rpc('get_user_profile_stats', {
    p_user_id: userId,
  })

  if (!rpcError && rpcData) {
    const row = Array.isArray(rpcData) ? rpcData[0] : rpcData
    if (row) {
      return mapRpcStats(row)
    }
  }

  const [completedCourses, completedLessons, certificates, coursesInProgress] = await Promise.all([
    supabase
      .from('user_course_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('enrollment_status', 'completed'),
    supabase
      .from('user_lesson_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_completed', true),
    supabase
      .from('user_course_certificates')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('user_course_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('enrollment_status', 'active'),
  ])

  return {
    completedCourses: completedCourses.count || 0,
    completedLessons: completedLessons.count || 0,
    certificates: certificates.count || 0,
    coursesInProgress: coursesInProgress.count || 0,
  }
}

async function countCompletedLessonsForCourses(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  courseIds: string[],
): Promise<number> {
  if (courseIds.length === 0) return 0

  const { data: modules } = await supabase
    .from('course_modules')
    .select('module_id')
    .in('course_id', courseIds)

  const moduleIds = (modules || []).map((module) => module.module_id)
  if (moduleIds.length === 0) return 0

  const { data: lessons } = await supabase
    .from('course_lessons')
    .select('lesson_id')
    .in('module_id', moduleIds)

  const lessonIds = (lessons || []).map((lesson) => lesson.lesson_id)
  if (lessonIds.length === 0) return 0

  const { count } = await supabase
    .from('user_lesson_progress')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_completed', true)
    .in('lesson_id', lessonIds)

  return count || 0
}
