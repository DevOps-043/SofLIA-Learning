import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ForbiddenError, NotFoundError } from '@/core/errors/app-error'

import { StudyPlannerService } from '../study-planner.service'
import type { StudyPlannerRepository } from '../study-planner.repository'
import type { StudyPlan, StudySession } from '../study-planner.types'

function makeSession(overrides: Partial<StudySession> = {}): StudySession {
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

function makePlan(overrides: Partial<StudyPlan> = {}): StudyPlan {
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

function makeRepository(
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

describe('StudyPlannerService', () => {
  let service: StudyPlannerService
  let repository: StudyPlannerRepository

  beforeEach(() => {
    vi.clearAllMocks()
    repository = makeRepository()
    service = new StudyPlannerService(repository)
  })

  describe('getSessions', () => {
    it('returns paginated sessions', async () => {
      const sessions = [makeSession(), makeSession({ id: 'session-2' })]
      vi.mocked(repository.findSessions).mockResolvedValue({ sessions, total: 2 })

      const result = await service.getSessions('user-1', {
        limit: 50,
        offset: 0,
        orderBy: 'start_time',
        orderDirection: 'asc',
      })

      expect(result.sessions).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.page).toBe(1)
      expect(result.total_pages).toBe(1)
    })

    it('filters by planId when provided', async () => {
      await service.getSessions('user-1', {
        limit: 50,
        offset: 0,
        planId: 'plan-1',
        orderBy: 'start_time',
        orderDirection: 'asc',
      })

      expect(repository.findSessions).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ planId: 'plan-1' }),
      )
    })

    it('calculates correct total_pages', async () => {
      vi.mocked(repository.findSessions).mockResolvedValue({ sessions: [], total: 123 })

      const result = await service.getSessions('user-1', {
        limit: 50,
        offset: 0,
        orderBy: 'start_time',
        orderDirection: 'asc',
      })

      expect(result.total_pages).toBe(3)
    })
  })

  describe('getSessionById', () => {
    it('returns session by id', async () => {
      const session = makeSession({ id: 'session-1' })
      vi.mocked(repository.findSessionById).mockResolvedValue(session)

      const result = await service.getSessionById('session-1', 'user-1')

      expect(result.id).toBe('session-1')
    })

    it('propagates NotFoundError from repository', async () => {
      vi.mocked(repository.findSessionById).mockRejectedValue(
        new NotFoundError('Sesión no encontrada'),
      )

      await expect(service.getSessionById('bad-id', 'user-1')).rejects.toThrow(NotFoundError)
    })

    it('propagates ForbiddenError when accessing other user session', async () => {
      vi.mocked(repository.findSessionById).mockRejectedValue(new ForbiddenError())

      await expect(service.getSessionById('session-1', 'other-user')).rejects.toThrow(ForbiddenError)
    })
  })

  describe('createSession', () => {
    it('creates a new session', async () => {
      const session = makeSession({ title: 'New Session' })
      vi.mocked(repository.createSession).mockResolvedValue(session)

      const result = await service.createSession('user-1', {
        planId: 'plan-1',
        title: 'New Session',
        startTime: '2026-04-10T09:00:00Z',
        endTime: '2026-04-10T10:00:00Z',
      })

      expect(result.title).toBe('New Session')
      expect(repository.createSession).toHaveBeenCalledWith('user-1', expect.objectContaining({ title: 'New Session' }))
    })
  })

  describe('updateSession', () => {
    it('updates session status', async () => {
      const updated = makeSession({ status: 'completed' })
      vi.mocked(repository.updateSession).mockResolvedValue(updated)

      const result = await service.updateSession('session-1', 'user-1', { status: 'completed' })

      expect(result.status).toBe('completed')
    })
  })

  describe('deleteSession', () => {
    it('deletes session by id', async () => {
      await service.deleteSession('session-1', 'user-1')

      expect(repository.deleteSession).toHaveBeenCalledWith('session-1', 'user-1')
    })
  })

  describe('getPlans', () => {
    it('returns all user plans', async () => {
      const plans = [makePlan(), makePlan({ id: 'plan-2' })]
      vi.mocked(repository.findPlans).mockResolvedValue(plans)

      const result = await service.getPlans('user-1')

      expect(result).toHaveLength(2)
    })

    it('returns empty array when no plans', async () => {
      const result = await service.getPlans('user-1')
      expect(result).toHaveLength(0)
    })
  })

  describe('createPlan', () => {
    it('creates a new study plan', async () => {
      const plan = makePlan({ title: 'New Plan' })
      vi.mocked(repository.createPlan).mockResolvedValue(plan)

      const result = await service.createPlan('user-1', {
        title: 'New Plan',
        startDate: '2026-04-01',
        endDate: '2026-04-30',
        dailyStudyMinutes: 60,
      })

      expect(result.title).toBe('New Plan')
    })
  })
})
