import { SupabaseClient } from '@supabase/supabase-js'
import { StudentEnrollment } from './types'

export async function getStudentEnrollment(
  supabase: SupabaseClient,
  courseId: string,
  userId: string,
): Promise<StudentEnrollment | null> {
  const primaryEnrollment = await supabase
    .from('user_course_enrollments')
    .select(
      `
        *,
        users:user_id (id, username, email, display_name, profile_picture_url)
      `,
    )
    .eq('course_id', courseId)
    .eq('user_id', userId)
    .single()

  if (primaryEnrollment.data) {
    const enrollment = primaryEnrollment.data as StudentEnrollment
    if (enrollment.users?.profile_picture_url && !enrollment.users.profile_picture) {
      enrollment.users.profile_picture = enrollment.users.profile_picture_url
    }
    return enrollment
  }

  const fallbackEnrollment = await supabase
    .from('course_enrollments')
    .select(
      `
        *,
        users:user_id (id, username, email, display_name, profile_picture)
      `,
    )
    .eq('course_id', courseId)
    .eq('user_id', userId)
    .single()

  return (fallbackEnrollment.data as StudentEnrollment | null) ?? null
}
