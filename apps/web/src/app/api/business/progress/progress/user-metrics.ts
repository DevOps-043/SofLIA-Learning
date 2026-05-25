import type {
  AssignmentRow,
  CertificateRow,
  EnrollmentRow,
  LessonProgressRow,
  OrgUserRow,
} from './types'

interface BuildUserMetricsInput {
  orgUsers: OrgUserRow[]
  assignments: AssignmentRow[]
  enrollments: EnrollmentRow[]
  lessonProgress: LessonProgressRow[]
  certificates: CertificateRow[]
}

export type BusinessProgressUserMetric = NonNullable<ReturnType<typeof buildUserMetric>>

export function buildUserMetrics(input: BuildUserMetricsInput): BusinessProgressUserMetric[] {
  return input.orgUsers
    .map((orgUser) => buildUserMetric(orgUser, input))
    .filter((user): user is BusinessProgressUserMetric => user !== null)
}

function buildUserMetric(
  orgUser: OrgUserRow,
  input: BuildUserMetricsInput,
) {
  const user = orgUser.users
  if (!user) return null

  const userAssignments = input.assignments.filter((assignment) => assignment.user_id === orgUser.user_id)
  const userEnrollments = input.enrollments.filter((enrollment) => enrollment.user_id === orgUser.user_id)
  const userProgress = input.lessonProgress.filter((progress) => progress.user_id === orgUser.user_id)
  const progressSum = userEnrollments.reduce((sum, item) => sum + (Number(item.overall_progress_percentage) || 0), 0)
  const timeSpentMinutes = userProgress.reduce((sum, item) => sum + (item.time_spent_minutes || 0), 0)

  return {
    user_id: orgUser.user_id,
    username: user.username,
    email: user.email,
    display_name: user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
    first_name: user.first_name,
    last_name: user.last_name,
    profile_picture_url: user.profile_picture_url,
    role: orgUser.role,
    last_login_at: user.last_login_at,
    courses_assigned: userAssignments.length,
    courses_completed: userAssignments.filter((assignment) => assignment.status === 'completed').length,
    courses_in_progress: userAssignments.filter((assignment) => assignment.status === 'in_progress').length,
    average_progress: userEnrollments.length > 0 ? Math.round((progressSum / userEnrollments.length) * 10) / 10 : 0,
    time_spent_hours: Math.round((timeSpentMinutes / 60) * 10) / 10,
    certificates_count: input.certificates.filter((certificate) => certificate.user_id === orgUser.user_id).length,
    last_activity: resolveLastActivity(userEnrollments),
  }
}

function resolveLastActivity(enrollments: EnrollmentRow[]): string | null {
  const lastActivity = enrollments.reduce((latest, enrollment) => {
    const lastAccess = enrollment.last_accessed_at ? new Date(enrollment.last_accessed_at) : null
    if (!latest) return lastAccess
    if (!lastAccess) return latest
    return lastAccess > latest ? lastAccess : latest
  }, null as Date | null)

  return lastActivity?.toISOString() || null
}
