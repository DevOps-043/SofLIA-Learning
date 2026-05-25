import { vi } from 'vitest'

import type { StudyPlannerRepository } from '../study-planner.repository'
import type { StudyPlan, StudySession } from '../study-planner.types'

export function makeSession(
  overrides: Partial<StudySession> = {},
): StudySession {
  return {
    id: 'session-1',
    user_id: 'user-1',
    plan_id: 'plan-1',
    course_id: null,
    title: 'Test Session',
    start_time: '2026-04-10T09:00:00Z',
    end_time: '2026-04-10T10:00:00Z',
    status: 'planned',
    notes: null,
    external_event_id: null,
    calendar_provider: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

export function makePlan(overrides: Partial<StudyPlan> = {}): StudyPlan {
  return {
    id: 'plan-1',
    user_id: 'user-1',
    course_id: null,
    title: 'Test Plan',
    start_date: '2026-04-01',
    end_date: '2026-04-30',
    daily_study_minutes: 60,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

export function makeRepository(
  overrides: Partial<StudyPlannerRepository> = {},
): StudyPlannerRepository {
  return {
    findSessions: vi.fn().mockResolvedValue({ sessions: [], total: 0 }),
    findSessionById: vi.fn().mockResolvedValue(makeSession()),
    createSession: vi.fn().mockResolvedValue(makeSession()),
    updateSession: vi.fn().mockResolvedValue(makeSession()),
    deleteSession: vi.fn().mockResolvedValue(undefined),
    findPlans: vi.fn().mockResolvedValue([]),
    findPlanById: vi.fn().mockResolvedValue(makePlan()),
    createPlan: vi.fn().mockResolvedValue(makePlan()),
    ...overrides,
  }
}
