import { createClient } from '../../../../lib/supabase/server'
import type { WorkshopStats } from './workshops-transform.service'

export async function getWorkshopStats(): Promise<WorkshopStats> {
  const supabase = await createClient()
  const [
    { count: totalWorkshops },
    { count: activeWorkshops },
    { data: coursesData },
    { data: assignmentsData },
  ] = await Promise.all([
    supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .or('approval_status.eq.approved,approval_status.is.null'),
    supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .or('approval_status.eq.approved,approval_status.is.null'),
    supabase
      .from('courses')
      .select('student_count, duration_total_minutes, instructor_id')
      .or('approval_status.eq.approved,approval_status.is.null'),
    supabase
      .from('user_course_enrollments')
      .select('course_id')
      .eq('enrollment_status', 'active'),
  ])

  const stats = summarizeWorkshopStats(coursesData || [], assignmentsData?.length || 0)

  return {
    totalWorkshops: totalWorkshops || 0,
    activeWorkshops: activeWorkshops || 0,
    totalStudents: stats.totalStudents,
    averageDuration: stats.averageDuration,
    totalInstructors: stats.totalInstructors,
  }
}

function summarizeWorkshopStats(
  courses: Array<{ duration_total_minutes: number | null; instructor_id: string | null }>,
  activeEnrollmentCount: number,
) {
  let totalDuration = 0
  let coursesWithDuration = 0
  const uniqueInstructors = new Set<string>()

  for (const course of courses) {
    if (course.duration_total_minutes && course.duration_total_minutes > 0) {
      totalDuration += course.duration_total_minutes
      coursesWithDuration++
    }

    if (course.instructor_id) uniqueInstructors.add(course.instructor_id)
  }

  return {
    totalStudents: activeEnrollmentCount,
    averageDuration: coursesWithDuration > 0
      ? Math.round(totalDuration / coursesWithDuration)
      : 0,
    totalInstructors: uniqueInstructors.size,
  }
}
