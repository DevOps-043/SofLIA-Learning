import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../../../lib/utils/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}))

import { fetchGlobalAnalyticsQueryData } from '../global-analytics-query.service'

interface MockResult<T = unknown> {
  data: T[]
  error: null
}

function createOrderChain(result: MockResult) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue(result),
  }
}

function createInChain(result: MockResult) {
  return {
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockResolvedValue(result),
  }
}

function createEqInChain(result: MockResult) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockResolvedValue(result),
  }
}

function createInGteChain(result: MockResult) {
  return {
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    gte: vi.fn().mockResolvedValue(result),
  }
}

function createEqChain(result: MockResult) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue(result),
  }
}

function createInEqChain(result: MockResult) {
  return {
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue(result),
  }
}

function createSupabaseMock(overrides: Partial<Record<string, MockResult>> = {}) {
  const results: Record<string, MockResult> = {
    organization_users: { data: [], error: null },
    users: { data: [], error: null },
    organization_course_assignments: { data: [], error: null },
    user_course_enrollments: { data: [], error: null },
    user_course_certificates: { data: [], error: null },
    user_lesson_progress: { data: [], error: null },
    daily_progress: { data: [], error: null },
    study_plans: { data: [], error: null },
    study_sessions: { data: [], error: null },
    study_plan_progress: { data: [], error: null },
    lia_conversations: { data: [], error: null },
    work_teams: { data: [], error: null },
    user_lesson_notes: { data: [], error: null },
    work_team_members: { data: [], error: null },
    lia_messages: { data: [], error: null },
    ...overrides,
  }

  const chains = {
    organization_users: createOrderChain(results.organization_users),
    users: createInChain(results.users),
    organization_course_assignments: createEqInChain(results.organization_course_assignments),
    user_course_enrollments: createInChain(results.user_course_enrollments),
    user_course_certificates: createInChain(results.user_course_certificates),
    user_lesson_progress: createInChain(results.user_lesson_progress),
    daily_progress: createInGteChain(results.daily_progress),
    study_plans: createInChain(results.study_plans),
    study_sessions: createInGteChain(results.study_sessions),
    study_plan_progress: createInChain(results.study_plan_progress),
    lia_conversations: createInChain(results.lia_conversations),
    work_teams: createEqChain(results.work_teams),
    user_lesson_notes: createInChain(results.user_lesson_notes),
    work_team_members: createInEqChain(results.work_team_members),
    lia_messages: createInChain(results.lia_messages),
  }

  const from = vi.fn((table: string) => {
    const chain = chains[table as keyof typeof chains]
    if (!chain) {
      throw new Error(`Unexpected table: ${table}`)
    }

    return chain
  })

  return {
    supabase: { from },
    from,
    chains,
  }
}

describe('global-analytics-query.service', () => {
  it('deduplicates identity emails, trims user payloads and skips dependent queries when not needed', async () => {
    const { supabase, from, chains } = createSupabaseMock({
      organization_users: {
        data: [
          {
            user_id: 'user-1',
            role: 'member',
            status: 'active',
            joined_at: '2026-01-01T00:00:00.000Z',
            job_title: null,
            users: {
              id: 'user-1',
              username: 'ana',
              email: 'shared@example.com',
              first_name: 'Ana',
              last_name: 'Ruiz',
              display_name: 'Ana Ruiz',
              profile_picture_url: null,
              last_login_at: '2026-03-30T00:00:00.000Z',
            },
          },
          {
            user_id: 'user-2',
            role: 'member',
            status: 'active',
            joined_at: '2026-01-02T00:00:00.000Z',
            job_title: null,
            users: {
              id: 'user-2',
              username: 'ana-duplicate',
              email: 'shared@example.com',
              first_name: 'Ana',
              last_name: 'Ruiz',
              display_name: null,
              profile_picture_url: null,
              last_login_at: '2026-03-25T00:00:00.000Z',
            },
          },
        ],
        error: null,
      },
      users: {
        data: [
          { id: 'user-1', email: 'shared@example.com' },
          { id: 'user-2', email: 'shared@example.com' },
        ],
        error: null,
      },
    })

    const result = await fetchGlobalAnalyticsQueryData(supabase as never, 'org-1')

    const organizationUsersSelect = String(chains.organization_users.select.mock.calls[0][0])
    const enrollmentsSelect = String(chains.user_course_enrollments.select.mock.calls[0][0])

    expect(organizationUsersSelect).toContain('last_login_at')
    expect(organizationUsersSelect).not.toContain('updated_at')
    expect(organizationUsersSelect).not.toContain('created_at')
    expect(organizationUsersSelect).not.toContain('cargo_rol')
    expect(enrollmentsSelect).not.toContain('slug')
    expect(chains.users.in).toHaveBeenCalledWith('email', ['shared@example.com'])
    expect(from.mock.calls.map(([table]) => table)).not.toContain('work_team_members')
    expect(from.mock.calls.map(([table]) => table)).not.toContain('lia_messages')
    expect(result.orgUsers).toHaveLength(2)
  })

  it('fetches dependent team and conversation data and normalizes returned records', async () => {
    const { supabase, from } = createSupabaseMock({
      organization_users: {
        data: [
          {
            user_id: 'user-1',
            role: 'admin',
            status: 'active',
            joined_at: '2026-01-01T00:00:00.000Z',
            job_title: 'Lider',
            users: {
              id: 'user-1',
              username: 'mario',
              email: 'mario@example.com',
              first_name: 'Mario',
              last_name: 'Lopez',
              display_name: 'Mario Lopez',
              profile_picture_url: null,
              last_login_at: '2026-03-30T00:00:00.000Z',
            },
          },
        ],
        error: null,
      },
      users: {
        data: [{ id: 'user-1', email: 'mario@example.com' }],
        error: null,
      },
      study_sessions: {
        data: [
          {
            id: 'session-1',
            user_id: 'user-1',
            start_time: '2026-03-10T09:00:00.000Z',
            actual_duration_minutes: null,
            duration_minutes: 25,
            status: 'completed',
            completed_at: '2026-03-10T09:25:00.000Z',
            session_type: 'planner',
            is_ai_generated: true,
          },
        ],
        error: null,
      },
      lia_conversations: {
        data: [
          {
            conversation_id: 'conv-1',
            user_id: 'user-1',
            context_type: 'course',
            created_at: '2026-03-10T09:00:00.000Z',
          },
        ],
        error: null,
      },
      work_teams: {
        data: [
          {
            team_id: 'team-1',
            name: 'Equipo A',
            description: 'Equipo principal',
            image_url: null,
          },
        ],
        error: null,
      },
      work_team_members: {
        data: [{ team_id: 'team-1', user_id: 'user-1' }],
        error: null,
      },
      lia_messages: {
        data: [
          {
            id: 'msg-1',
            conversation_id: 'conv-1',
            role: 'user',
            user_id: 'user-1',
          },
        ],
        error: null,
      },
      user_lesson_notes: {
        data: [{ note_id: 'note-1', user_id: 'user-1', is_auto_generated: true }],
        error: null,
      },
    })

    const result = await fetchGlobalAnalyticsQueryData(supabase as never, 'org-1')

    expect(from.mock.calls.map(([table]) => table)).toContain('work_team_members')
    expect(from.mock.calls.map(([table]) => table)).toContain('lia_messages')
    expect(result.studySessions[0]).toMatchObject({
      id: 'session-1',
      user_id: 'user-1',
      actual_duration_minutes: 25,
    })
    expect(result.userNotes[0]).toEqual({
      id: 'note-1',
      user_id: 'user-1',
      is_auto_generated: true,
    })
    expect(result.nodes[0]).toMatchObject({
      id: 'team-1',
      organization_node_users: [{ user_id: 'user-1' }],
    })
    expect(result.liaMessages[0]).toMatchObject({
      id: 'msg-1',
      conversation_id: 'conv-1',
      user_id: 'user-1',
    })
  })
})
