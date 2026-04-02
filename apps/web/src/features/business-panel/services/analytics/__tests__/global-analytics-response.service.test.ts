import { describe, expect, it } from 'vitest'
import { buildGlobalAnalyticsResponse } from '../global-analytics-response.service'
import type { GlobalAnalyticsQueryData } from '../global-analytics-query.service'

describe('global-analytics-response.service', () => {
  it('builds global analytics metrics, study planner data and active users by month', () => {
    const data: GlobalAnalyticsQueryData = {
      orgUsers: [
        {
          user_id: 'user-1',
          role: 'member',
          status: 'active',
          joined_at: '2025-01-01T00:00:00.000Z',
          job_title: 'Analista',
          users: {
            id: 'user-1',
            username: 'ana',
            email: 'ana@example.com',
            first_name: 'Ana',
            last_name: 'Ruiz',
            display_name: 'Ana Ruiz',
            profile_picture_url: null,
            last_login_at: '2025-03-20T00:00:00.000Z',
            updated_at: null,
            created_at: null,
            cargo_rol: null,
          },
        },
        {
          user_id: 'user-2',
          role: 'admin',
          status: 'active',
          joined_at: '2025-01-02T00:00:00.000Z',
          job_title: 'Líder',
          users: {
            id: 'user-2',
            username: 'mario',
            email: 'mario@example.com',
            first_name: 'Mario',
            last_name: 'López',
            display_name: null,
            profile_picture_url: null,
            last_login_at: '2025-03-15T00:00:00.000Z',
            updated_at: null,
            created_at: null,
            cargo_rol: null,
          },
        },
      ],
      assignments: [
        {
          id: 'assign-1',
          user_id: 'user-1',
          course_id: 'course-1',
          status: 'completed',
          completion_percentage: 100,
          assigned_at: '2025-01-01T00:00:00.000Z',
          due_date: null,
          completed_at: '2025-02-01T00:00:00.000Z',
        },
      ],
      enrollments: [
        {
          enrollment_id: 'enr-1',
          user_id: 'user-1',
          course_id: 'course-1',
          overall_progress_percentage: 100,
          enrollment_status: 'completed',
          completed_at: '2025-02-01T00:00:00.000Z',
          started_at: '2025-01-10T00:00:00.000Z',
          enrolled_at: '2025-01-09T00:00:00.000Z',
          last_accessed_at: '2025-02-01T00:00:00.000Z',
          courses: { id: 'course-1', title: 'Curso A', slug: 'curso-a' },
        },
      ],
      certificates: [
        {
          certificate_id: 'cert-1',
          user_id: 'user-1',
          course_id: 'course-1',
          issued_at: '2025-02-01T00:00:00.000Z',
        },
      ],
      lessonProgress: [
        {
          progress_id: 'lp-1',
          user_id: 'user-1',
          lesson_id: 'lesson-1',
          enrollment_id: 'enr-1',
          time_spent_minutes: 120,
          is_completed: true,
          completed_at: '2025-02-01T00:00:00.000Z',
          started_at: '2025-01-10T00:00:00.000Z',
          last_accessed_at: '2025-02-01T00:00:00.000Z',
          quiz_completed: true,
          quiz_passed: true,
        },
      ],
      dailyProgress: [
        {
          user_id: 'user-1',
          progress_date: '2025-03-10',
          had_activity: true,
          streak_count: 4,
          study_minutes: 45,
          sessions_completed: 1,
          sessions_missed: 0,
        },
        {
          user_id: 'user-2',
          progress_date: '2025-03-12',
          had_activity: true,
          streak_count: 1,
          study_minutes: 20,
          sessions_completed: 1,
          sessions_missed: 0,
        },
      ],
      studyPlans: [
        {
          id: 'plan-1',
          user_id: 'user-1',
          status: 'active',
          created_at: '2025-03-01T00:00:00.000Z',
        },
      ],
      studySessions: [
        {
          id: 'session-1',
          user_id: 'user-1',
          start_time: '2025-03-10T09:00:00.000Z',
          actual_duration_minutes: 45,
          status: 'completed',
          completed_at: '2025-03-10T09:45:00.000Z',
          session_type: 'study',
          is_ai_generated: true,
        },
      ],
      studyPlanProgress: [
        {
          plan_id: 'plan-1',
          user_id: 'user-1',
          plan_name: 'Plan 1',
          total_sessions: 4,
          sessions_completed: 3,
          sessions_pending: 1,
        },
      ],
      nodes: [
        {
          id: 'team-1',
          name: 'Equipo A',
          type: 'team',
          properties: { description: 'Equipo A', image_url: null },
          organization_node_users: [{ user_id: 'user-1' }, { user_id: 'user-2' }],
        },
      ],
      liaConversations: [
        {
          id: 'conv-1',
          user_id: 'user-1',
          context_type: 'course',
          created_at: '2025-03-10T09:00:00.000Z',
        },
      ],
      liaMessages: [
        {
          id: 'msg-1',
          conversation_id: 'conv-1',
          role: 'user',
          user_id: 'user-1',
        },
      ],
      userNotes: [
        {
          id: 'note-1',
          user_id: 'user-1',
          is_auto_generated: true,
        },
      ],
      thirtyDaysAgoStr: '2025-03-01',
    }

    const response = buildGlobalAnalyticsResponse(data)

    expect(response.general_metrics.total_users).toBe(2)
    expect(response.trends.active_users_by_month).toEqual([{ date: '2025-03', count: 2 }])
    expect(response.user_analytics[0].stats.courses.notes_auto_generated).toBe(1)
    expect(response.study_planner?.user_adherence[0]).toMatchObject({
      user_id: 'user-1',
      adherence_rate: 75,
      total_sessions: 4,
      completed_sessions: 3,
    })
    expect(response.teams.teams[0].stats.lia_conversations).toBe(1)
    expect(response.engagement_metrics.frequency.length).toBeGreaterThan(0)
  })
})
