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
  } catch {
    return createEmptyUserStats()
  }
}
