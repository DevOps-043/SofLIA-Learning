import type {
  AnalyticsOrganizationInfo,
  AnalyticsSourceData,
  AnalyticsUserProfileRecord,
} from '../analytics.types'
import {
  assignment,
  dailyProgress,
  enrollment,
  lessonProgress,
  studySession,
} from './analytics.fixture-builders'

export const organization: AnalyticsOrganizationInfo = {
  id: 'org-1',
  name: 'Acme',
  slug: 'acme',
}

function profile(
  id: string,
  username: string,
  displayName: string | null,
  lastLogin: string,
): AnalyticsUserProfileRecord {
  const [firstName, lastName = null] = displayName?.split(' ') ?? [username, null]

  return {
    id,
    username,
    email: `${username}@example.com`,
    first_name: firstName,
    last_name: lastName,
    display_name: displayName,
    profile_picture_url: null,
    last_login_at: lastLogin,
  }
}

export function createSourceData(
  overrides: Partial<AnalyticsSourceData> = {},
): AnalyticsSourceData {
  return {
    organization,
    orgUsers: [
      {
        user_id: 'user-1',
        role: 'member',
        status: 'active',
        joined_at: '2026-01-10T00:00:00.000Z',
        job_title: 'Sales',
        users: profile('user-1', 'ana', 'Ana Lopez', '2026-04-01T12:00:00.000Z'),
      },
      {
        user_id: 'user-2',
        role: 'member',
        status: 'active',
        joined_at: '2026-01-12T00:00:00.000Z',
        job_title: 'Support',
        users: profile('user-2', 'mario', null, '2026-03-10T12:00:00.000Z'),
      },
    ],
    assignments: [
      assignment('assignment-1', 'user-1', 'course-1', 'completed', 100, '2026-03-20T00:00:00.000Z'),
      assignment('assignment-2', 'user-2', 'course-2', 'in_progress', 50, null),
    ],
    enrollments: [
      enrollment('enroll-1', 'user-1', 'course-1', 100, 'completed', '2026-03-20T00:00:00.000Z'),
      enrollment('enroll-2', 'user-2', 'course-2', 50, 'active', null),
    ],
    certificates: [
      { certificate_id: 'cert-1', user_id: 'user-1', course_id: 'course-1', issued_at: '2026-03-20T00:00:00.000Z' },
    ],
    lessonProgress: [
      lessonProgress('progress-1', 'user-1', 'lesson-1', 'enroll-1', 120, true),
      lessonProgress('progress-2', 'user-2', 'lesson-2', 'enroll-2', 30, false),
    ],
    dailyProgress: [
      dailyProgress('user-1', '2026-04-01', true, 5, 45, 1, 0),
      dailyProgress('user-2', '2026-03-01', false, 0, 0, 0, 0),
    ],
    studySessions: [
      studySession('session-1', 'user-1', 45, 'completed', '2026-04-01T08:45:00.000Z'),
      studySession('session-2', 'user-2', 30, 'pending', null),
    ],
    nodes: [
      {
        id: 'team-1',
        name: 'Equipo Norte',
        type: 'team',
        properties: { description: 'Equipo principal' },
        organization_node_users: [{ user_id: 'user-1' }, { user_id: 'user-2' }],
      },
    ],
    activeSinceDate: '2026-03-03',
    ...overrides,
  }
}
