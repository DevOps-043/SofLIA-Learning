import { describe, expect, it } from 'vitest'
import {
  buildBusinessAnalyticsResponse,
  getEmptyBusinessAnalyticsResponse,
  getRelevantAnalyticsCourseIds,
} from '../analytics-response.service'

describe('analytics-response.service', () => {
  it('returns an empty analytics payload when no users are present', () => {
    expect(getEmptyBusinessAnalyticsResponse()).toMatchObject({
      success: true,
      general_metrics: {
        total_users: 0,
        total_courses_assigned: 0,
        completed_courses: 0,
      },
      user_analytics: [],
      teams: {
        total_teams: 0,
        teams: [],
        ranking: [],
      },
    })
  })

  it('deduplicates relevant course ids from assignments and enrollments', () => {
    expect(
      getRelevantAnalyticsCourseIds({
        assignments: [
          {
            id: 'assignment-1',
            user_id: 'user-1',
            course_id: 'course-1',
            status: 'assigned',
            completion_percentage: 0,
            assigned_at: null,
            due_date: null,
            completed_at: null,
          },
          {
            id: 'assignment-2',
            user_id: 'user-2',
            course_id: 'course-2',
            status: 'assigned',
            completion_percentage: 0,
            assigned_at: null,
            due_date: null,
            completed_at: null,
          },
        ],
        enrollments: [
          {
            enrollment_id: 'enrollment-1',
            user_id: 'user-1',
            course_id: 'course-1',
            overall_progress_percentage: 25,
            enrollment_status: 'active',
            completed_at: null,
            started_at: '2026-03-01',
          },
        ],
      }),
    ).toEqual(['course-1', 'course-2'])
  })

  it('builds the analytics response from grouped source data', () => {
    const response = buildBusinessAnalyticsResponse({
      orgUsers: [
        {
          user_id: 'user-1',
          role: 'student',
          status: 'active',
          joined_at: '2026-01-01',
          job_title: null,
          users: {
            id: 'user-1',
            username: 'ana',
            email: 'ana@example.com',
            first_name: 'Ana',
            last_name: 'Lopez',
            display_name: 'Ana Lopez',
            profile_picture_url: null,
            last_login_at: '2026-03-30T10:00:00.000Z',
          },
        },
        {
          user_id: 'user-2',
          role: 'admin',
          status: 'active',
          joined_at: '2026-01-15',
          job_title: null,
          users: {
            id: 'user-2',
            username: 'mario',
            email: 'mario@example.com',
            first_name: 'Mario',
            last_name: 'Perez',
            display_name: null,
            profile_picture_url: null,
            last_login_at: '2026-03-20T10:00:00.000Z',
          },
        },
      ],
      assignments: [
        {
          id: 'assignment-1',
          user_id: 'user-1',
          course_id: 'course-1',
          status: 'completed',
          completion_percentage: 100,
          assigned_at: '2026-03-01',
          due_date: null,
          completed_at: '2026-03-20',
        },
        {
          id: 'assignment-2',
          user_id: 'user-2',
          course_id: 'course-2',
          status: 'assigned',
          completion_percentage: 50,
          assigned_at: '2026-03-02',
          due_date: null,
          completed_at: null,
        },
      ],
      enrollments: [
        {
          enrollment_id: 'enrollment-1',
          user_id: 'user-1',
          course_id: 'course-1',
          overall_progress_percentage: 100,
          enrollment_status: 'completed',
          completed_at: '2026-03-20',
          started_at: '2026-03-01',
        },
        {
          enrollment_id: 'enrollment-2',
          user_id: 'user-2',
          course_id: 'course-2',
          overall_progress_percentage: 50,
          enrollment_status: 'active',
          completed_at: null,
          started_at: '2026-03-02',
        },
      ],
      certificates: [
        {
          certificate_id: 'certificate-1',
          user_id: 'user-1',
          course_id: 'course-1',
          issued_at: '2026-03-20',
        },
      ],
      lessonProgress: [
        {
          user_id: 'user-1',
          lesson_id: 'lesson-1',
          enrollment_id: 'enrollment-1',
          time_spent_minutes: 90,
          is_completed: true,
          completed_at: '2026-03-10',
          last_accessed_at: '2026-03-10',
          quiz_completed: true,
          quiz_passed: true,
        },
        {
          user_id: 'user-2',
          lesson_id: 'lesson-2',
          enrollment_id: 'enrollment-2',
          time_spent_minutes: 30,
          is_completed: false,
          completed_at: null,
          last_accessed_at: '2026-03-11',
          quiz_completed: false,
          quiz_passed: false,
        },
      ],
      dailyProgress: [
        {
          user_id: 'user-1',
          progress_date: '2026-03-31',
          had_activity: true,
          streak_count: 4,
          study_minutes: 30,
          sessions_completed: 1,
          sessions_missed: 0,
        },
        {
          user_id: 'user-2',
          progress_date: '2026-03-15',
          had_activity: false,
          streak_count: 0,
          study_minutes: 0,
          sessions_completed: 0,
          sessions_missed: 0,
        },
      ],
      studySessions: [
        {
          id: 'session-1',
          user_id: 'user-1',
          start_time: '2026-03-31T08:00:00.000Z',
          actual_duration_minutes: 45,
          status: 'completed',
          completed_at: '2026-03-31T08:45:00.000Z',
          session_type: 'planner',
        },
        {
          id: 'session-2',
          user_id: 'user-2',
          start_time: '2026-03-30T09:00:00.000Z',
          actual_duration_minutes: 30,
          status: 'pending',
          completed_at: null,
          session_type: 'planner',
        },
      ],
      nodes: [
        {
          id: 'team-1',
          name: 'Equipo A',
          type: 'team',
          properties: {
            description: 'Equipo principal',
            image_url: 'https://example.com/team-a.png',
          },
          organization_node_users: [
            { user_id: 'user-1' },
            { user_id: 'user-2' },
          ],
        },
      ],
      liaConversations: [
        {
          id: 'conversation-1',
          user_id: 'user-1',
          context_type: 'course',
          created_at: '2026-03-21',
        },
      ],
      liaMessages: [
        {
          id: 'message-1',
          conversation_id: 'conversation-1',
          role: 'user',
          user_id: 'user-1',
        },
        {
          id: 'message-2',
          conversation_id: 'conversation-1',
          role: 'assistant',
          user_id: 'user-1',
        },
      ],
      userNotes: [
        {
          id: 'note-1',
          user_id: 'user-1',
        },
      ],
      courses: [
        {
          id: 'course-1',
          title: 'Curso 1',
        },
        {
          id: 'course-2',
          title: 'Curso 2',
        },
      ],
      thirtyDaysAgoStr: '2026-03-01',
    })

    expect(response.general_metrics).toMatchObject({
      total_users: 2,
      total_courses_assigned: 2,
      completed_courses: 1,
      total_certificates: 1,
      active_users: 1,
      retention_rate: 50,
    })
    expect(response.user_analytics[0]).toMatchObject({
      user_id: 'user-1',
      display_name: 'Ana Lopez',
      courses_completed: 1,
      total_time_minutes: 90,
    })
    expect(response.user_analytics[0].stats).toMatchObject({
      current_streak: 4,
      planner: {
        adherence: 100,
        total_sessions: 1,
        completed: 1,
        pending: 0,
      },
      courses: {
        notes_count: 1,
      },
      lia: {
        total_conversations: 1,
        total_messages: 2,
        user_messages: 1,
        assistant_responses: 1,
        contexts: {
          ai_chat: 0,
          course: 1,
        },
      },
    })
    expect(response.user_analytics[0].stats.courses.breakdown[0]).toMatchObject({
      course_id: 'course-1',
      course_title: 'Curso 1',
      progress: 100,
      status: 'completed',
    })
    expect(response.teams.total_teams).toBe(1)
    expect(response.teams.ranking[0]).toMatchObject({
      team_id: 'team-1',
      name: 'Equipo A',
      member_count: 2,
    })
  })
})
