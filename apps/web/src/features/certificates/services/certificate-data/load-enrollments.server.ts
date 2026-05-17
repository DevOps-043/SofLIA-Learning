import type { CertificateRow, EnrollmentOrganizationRow, SupabaseServerClient } from './types'

export async function loadEnrollmentsMap(
  supabase: SupabaseServerClient,
  certificateRows: CertificateRow[],
): Promise<Map<string, string | null>> {
  const enrollmentIds = [...new Set(
    certificateRows
      .map(row => row.enrollment_id)
      .filter((value): value is string => Boolean(value)),
  )]

  if (enrollmentIds.length === 0) {
    return new Map<string, string | null>()
  }

  const { data, error } = await supabase
    .from('user_course_enrollments')
    .select('enrollment_id, organization_id')
    .in('enrollment_id', enrollmentIds)

  if (error) {
    throw error
  }

  return new Map(
    ((data || []) as EnrollmentOrganizationRow[]).map(enrollment => [
      enrollment.enrollment_id,
      enrollment.organization_id,
    ]),
  )
}
