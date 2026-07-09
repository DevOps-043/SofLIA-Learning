import type { BusinessUserStatsQueryData } from '../business-user-stats-query.service'

export function createStatsData(
  overrides: Partial<BusinessUserStatsQueryData> = {},
): BusinessUserStatsQueryData {
  return {
    organizationUser: {
      user_id: 'user-1',
      organization_id: 'org-1',
      joined_at: '2025-01-10T00:00:00.000Z',
      role: 'member',
      job_title: 'Analista',
      users: {
        id: 'user-1',
        username: 'ana',
        email: 'ana@example.com',
        first_name: 'Ana',
        last_name: 'Ruiz',
        display_name: 'Ana Ruiz',
        profile_picture_url: null,
      },
    },
    enrollments: [],
    lessonProgress: [],
    lessons: [],
    courseModules: [],
    lessonCounts: [],
    lessonActivities: [],
    activityCompletions: [],
    lessonNotes: [],
    certificates: [],
    instructors: [],
    dialogueSessions: [],
    liaConversations: [],
    liaMessages: [],
    quizSubmissions: [],
    assignments: [],
    learningPathCourseOrder: new Map(),
    ...overrides,
  }
}

export function createEnrollment(
  courseId: string,
  title: string,
  overrides: Record<string, unknown> = {},
): BusinessUserStatsQueryData['enrollments'][number] {
  return {
    enrollment_id: `enr-${courseId}`,
    enrollment_status: 'active',
    overall_progress_percentage: 0,
    enrolled_at: null,
    started_at: null,
    completed_at: null,
    last_accessed_at: null,
    course_id: courseId,
    courses: { id: courseId, title },
    ...overrides,
  } as BusinessUserStatsQueryData['enrollments'][number]
}

export function createAssignment(
  id: string,
  courseId: string,
  title: string,
  overrides: Record<string, unknown> = {},
): BusinessUserStatsQueryData['assignments'][number] {
  return {
    id,
    course_id: courseId,
    status: 'assigned',
    completion_percentage: 0,
    assigned_at: '2025-01-12T00:00:00.000Z',
    due_date: null,
    completed_at: null,
    courses: { id: courseId, title },
    ...overrides,
  } as BusinessUserStatsQueryData['assignments'][number]
}
