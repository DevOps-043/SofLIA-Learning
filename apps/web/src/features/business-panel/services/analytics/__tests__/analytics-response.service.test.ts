import { describe, expect, it } from 'vitest'

import type { BuildBusinessAnalyticsResponseInput } from '../analytics-response.types'
import { buildBusinessAnalyticsResponse } from '../analytics-response.service'

function buildInput(): BuildBusinessAnalyticsResponseInput {
  return {
    assignments: [
      {
        assigned_at: '2026-03-01T00:00:00.000Z',
        completed_at: null,
        completion_percentage: 40,
        course_id: 'course-1',
        due_date: null,
        id: 'assignment-1',
        status: null,
        user_id: 'user-1',
      },
      {
        assigned_at: '2026-03-15T00:00:00.000Z',
        completed_at: '2026-04-01T00:00:00.000Z',
        completion_percentage: 100,
        course_id: 'course-1',
        due_date: null,
        id: 'assignment-2',
        status: 'completed',
        user_id: 'user-2',
      },
    ],
    certificates: [
      {
        certificate_id: 'certificate-1',
        course_id: 'course-1',
        issued_at: '2026-04-01T00:00:00.000Z',
        user_id: 'user-2',
      },
    ],
    courses: [
      {
        id: 'course-1',
        title: 'Curso Liderazgo',
      },
    ],
    dailyProgress: [
      {
        had_activity: true,
        progress_date: '2026-04-01',
        sessions_completed: 1,
        sessions_missed: 0,
        streak_count: 3,
        study_minutes: 20,
        user_id: 'user-1',
      },
      {
        had_activity: true,
        progress_date: '2026-04-01',
        sessions_completed: 1,
        sessions_missed: 0,
        streak_count: 7,
        study_minutes: 60,
        user_id: 'user-2',
      },
    ],
    enrollments: [
      {
        completed_at: null,
        course_id: 'course-1',
        enrolled_at: '2026-03-01T00:00:00.000Z',
        enrollment_id: 'enrollment-1',
        enrollment_status: 'active',
        overall_progress_percentage: 60,
        started_at: '2026-03-01T00:00:00.000Z',
        user_id: 'user-1',
      },
      {
        completed_at: '2026-04-01T00:00:00.000Z',
        course_id: 'course-1',
        enrolled_at: '2026-03-15T00:00:00.000Z',
        enrollment_id: 'enrollment-2',
        enrollment_status: 'completed',
        overall_progress_percentage: 100,
        started_at: '2026-03-15T00:00:00.000Z',
        user_id: 'user-2',
      },
    ],
    lessonProgress: [
      {
        completed_at: '2026-04-01T09:00:00.000Z',
        enrollment_id: 'enrollment-1',
        is_completed: true,
        last_accessed_at: '2026-04-01T09:00:00.000Z',
        lesson_id: 'lesson-1',
        quiz_completed: false,
        quiz_passed: false,
        time_spent_minutes: 30,
        user_id: 'user-1',
      },
      {
        completed_at: '2026-04-01T10:00:00.000Z',
        enrollment_id: 'enrollment-2',
        is_completed: true,
        last_accessed_at: '2026-04-01T10:00:00.000Z',
        lesson_id: 'lesson-2',
        quiz_completed: true,
        quiz_passed: true,
        time_spent_minutes: 90,
        user_id: 'user-2',
      },
    ],
    liaConversations: [
      {
        context_type: 'course',
        created_at: '2026-04-01T10:00:00.000Z',
        id: 'conversation-1',
        user_id: 'user-1',
      },
      {
        context_type: 'ai_chat',
        created_at: '2026-04-01T11:00:00.000Z',
        id: 'conversation-2',
        user_id: 'user-2',
      },
    ],
    liaMessages: [
      {
        conversation_id: 'conversation-1',
        id: 'message-1',
        role: 'user',
        user_id: 'user-1',
      },
      {
        conversation_id: 'conversation-1',
        id: 'message-2',
        role: 'assistant',
        user_id: 'user-1',
      },
      {
        conversation_id: 'conversation-2',
        id: 'message-3',
        role: 'user',
        user_id: 'user-2',
      },
    ],
    nodes: [
      {
        id: 'team-1',
        name: 'Equipo Norte',
        organization_node_users: [{ user_id: 'user-1' }, { user_id: 'user-2' }],
        properties: {
          description: 'Equipo comercial',
          image_url: 'https://example.com/team.png',
        },
        type: 'team',
      },
    ],
    orgUsers: [
      {
        job_title: 'manager',
        joined_at: '2026-01-01T00:00:00.000Z',
        role: 'admin',
        status: 'active',
        user_id: 'user-1',
        users: {
          display_name: 'Ada',
          email: 'ada@example.com',
          first_name: 'Ada',
          id: 'profile-1',
          last_login_at: '2026-04-01T08:00:00.000Z',
          last_name: 'Lovelace',
          profile_picture_url: null,
          username: 'ada',
        },
      },
      {
        job_title: null,
        joined_at: '2026-02-01T00:00:00.000Z',
        role: 'member',
        status: 'active',
        user_id: 'user-2',
        users: {
          display_name: 'Grace',
          email: 'grace@example.com',
          first_name: 'Grace',
          id: 'profile-2',
          last_login_at: '2026-04-01T09:00:00.000Z',
          last_name: 'Hopper',
          profile_picture_url: null,
          username: 'grace',
        },
      },
    ],
    studySessions: [
      {
        actual_duration_minutes: 30,
        completed_at: '2026-04-01T09:30:00.000Z',
        id: 'session-1',
        session_type: 'study',
        start_time: new Date(2026, 3, 1, 9, 0, 0).toISOString(),
        status: 'completed',
        user_id: 'user-1',
      },
      {
        actual_duration_minutes: 60,
        completed_at: '2026-04-01T10:00:00.000Z',
        id: 'session-2',
        session_type: 'study',
        start_time: new Date(2026, 3, 1, 10, 0, 0).toISOString(),
        status: 'completed',
        user_id: 'user-2',
      },
    ],
    thirtyDaysAgoStr: '2026-03-02',
    userNotes: [
      {
        id: 'note-1',
        user_id: 'user-1',
      },
    ],
  }
}

describe('analytics-response service', () => {
  it('returns an empty response when there are no organization users', () => {
    const response = buildBusinessAnalyticsResponse({
      ...buildInput(),
      orgUsers: [],
    })

    expect(response.general_metrics).toMatchObject({
      total_users: 0,
      total_courses_assigned: 0,
    })
    expect(response.user_analytics).toEqual([])
  })

  it('builds business analytics sections from grouped backend data', () => {
    const response = buildBusinessAnalyticsResponse(buildInput())
    const adaAnalytics = response.user_analytics.find((user) => user.user_id === 'user-1')

    expect(response.general_metrics).toEqual({
      active_users: 2,
      average_progress: 80,
      completed_courses: 1,
      retention_rate: 100,
      total_certificates: 1,
      total_courses_assigned: 2,
      total_time_hours: 2,
      total_users: 2,
    })
    expect(response.trends).toMatchObject({
      active_users_by_month: [{ count: 2, date: '2026-04' }],
      completions_by_month: [{ count: 1, date: '2026-04' }],
      enrollments_by_month: [{ count: 2, date: '2026-03' }],
      time_by_month: [{ count: 2, date: '2026-04' }],
    })
    expect(response.by_role.distribution).toEqual(
      expect.arrayContaining([
        { count: 1, role: 'manager' },
        { count: 1, role: 'member' },
      ]),
    )
    expect(response.course_metrics.distribution).toEqual(
      expect.arrayContaining([
        { count: 1, status: 'completed' },
        { count: 1, status: 'in_progress' },
      ]),
    )
    expect(response.teams).toMatchObject({
      total_teams: 1,
      teams: [
        {
          description: 'Equipo comercial',
          member_count: 2,
          name: 'Equipo Norte',
          stats: {
            average_progress: 80,
            courses_completed: 1,
            total_enrollments: 2,
            total_time_hours: 2,
          },
          team_id: 'team-1',
        },
      ],
    })
    expect(adaAnalytics).toMatchObject({
      average_progress: 60,
      certificates_count: 0,
      courses_assigned: 1,
      courses_completed: 0,
      display_name: 'Ada',
      name: 'Ada Lovelace',
      total_time_minutes: 30,
    })
    expect(adaAnalytics?.stats).toMatchObject({
      current_streak: 3,
      courses: {
        breakdown: [
          {
            course_id: 'course-1',
            course_title: 'Curso Liderazgo',
            progress: 60,
            status: 'active',
          },
        ],
        notes_count: 1,
      },
      lia: {
        assistant_responses: 1,
        contexts: {
          ai_chat: 0,
          course: 1,
        },
        total_conversations: 1,
      },
      planner: {
        adherence: 100,
        completed_sessions: 1,
        total_sessions: 1,
      },
    })
  })
})
