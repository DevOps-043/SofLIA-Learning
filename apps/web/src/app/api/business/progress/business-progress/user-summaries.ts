import type { DashboardQueriesResult, OrganizationUserRow } from './types'

export function buildUserSummaries(
  orgUsers: OrganizationUserRow[],
  data: DashboardQueriesResult,
) {
  return orgUsers
    .map((organizationUser) => buildUserSummary(organizationUser, data))
    .filter((user) => user !== null)
}

function buildUserSummary(organizationUser: OrganizationUserRow, data: DashboardQueriesResult) {
  const user = organizationUser.users
  if (!user) return null

  const userAssignments = data.assignments.filter((item) => item.user_id === organizationUser.user_id)
  const userEnrollments = data.enrollments.filter((item) => item.user_id === organizationUser.user_id)
  const userProgress = data.lessonProgress.filter((item) => item.user_id === organizationUser.user_id)
  const userCertificates = data.certificates.filter((item) => item.user_id === organizationUser.user_id)
  const progressSum = userEnrollments.reduce(
    (sum, enrollment) => sum + (Number(enrollment.overall_progress_percentage) || 0),
    0,
  )

  return {
    user_id: organizationUser.user_id,
    username: user.username,
    email: user.email,
    display_name: resolveDisplayName(user),
    first_name: user.first_name,
    last_name: user.last_name,
    profile_picture_url: user.profile_picture_url,
    role: organizationUser.role,
    last_login_at: user.last_login_at,
    courses_assigned: userAssignments.length,
    courses_completed: userAssignments.filter((item) => item.status === 'completed').length,
    courses_in_progress: userAssignments.filter((item) => item.status === 'in_progress').length,
    average_progress: userEnrollments.length > 0
      ? Math.round((progressSum / userEnrollments.length) * 10) / 10
      : 0,
    time_spent_hours: resolveUserHours(userProgress),
    certificates_count: userCertificates.length,
    last_activity: resolveLastActivity(userEnrollments),
  }
}

function resolveDisplayName(user: NonNullable<OrganizationUserRow['users']>) {
  return (
    user.display_name ||
    `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
    user.username
  )
}

function resolveUserHours(progressRows: DashboardQueriesResult['lessonProgress']) {
  const minutes = progressRows.reduce((sum, progress) => sum + (progress.time_spent_minutes || 0), 0)
  return Math.round((minutes / 60) * 10) / 10
}

function resolveLastActivity(enrollments: DashboardQueriesResult['enrollments']) {
  const lastActivity = enrollments.reduce((latest, enrollment) => {
    const lastAccess = enrollment.last_accessed_at ? new Date(enrollment.last_accessed_at) : null
    if (!latest) return lastAccess
    if (!lastAccess) return latest
    return lastAccess > latest ? lastAccess : latest
  }, null as Date | null)

  return lastActivity?.toISOString() || null
}
