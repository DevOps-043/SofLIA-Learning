import { createClient } from '../../../../lib/supabase/server'
import { createEmptyUserStats } from '../profile.shared'

export async function getUserStats(userId: string): Promise<{
  completedCourses: number
  completedLessons: number
  certificates: number
  coursesInProgress: number
}> {
  try {
    const supabase = await createClient()
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
