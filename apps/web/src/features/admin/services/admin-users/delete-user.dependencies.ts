import type { AdminSupabaseClient } from './delete-user.types'

export async function deleteEnrollmentDependencies(
  adminSupabase: AdminSupabaseClient,
  userId: string,
) {
  const { data: enrollments } = await adminSupabase
    .from('user_course_enrollments')
    .select('enrollment_id')
    .eq('user_id', userId)

  const enrollmentIds =
    (enrollments || []).map(
      (e: { enrollment_id: string }) => e.enrollment_id,
    )

  if (!enrollmentIds.length) {
    return
  }

  await adminSupabase
    .from('user_lesson_progress')
    .delete()
    .in('enrollment_id', enrollmentIds)

  await adminSupabase
    .from('user_quiz_submissions')
    .delete()
    .in('enrollment_id', enrollmentIds)

  await adminSupabase
    .from('user_course_certificates')
    .delete()
    .in('enrollment_id', enrollmentIds)
}
