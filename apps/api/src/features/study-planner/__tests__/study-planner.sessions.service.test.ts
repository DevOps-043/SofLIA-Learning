import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ForbiddenError, NotFoundError } from '@/core/errors/app-error'

import { StudyPlannerService } from '../study-planner.service'
import type { StudyPlannerRepository } from '../study-planner.repository'
import { makeRepository, makeSession } from './study-planner.fixtures'

describe('StudyPlannerService sessions', () => {
  let service: StudyPlannerService
  let repository: StudyPlannerRepository

  beforeEach(() => {
    vi.clearAllMocks()
    repository = makeRepository()
    service = new StudyPlannerService(repository)
  })

  it('returns paginated sessions', async () => {
    const sessions = [makeSession(), makeSession({ id: 'session-2' })]
    vi.mocked(repository.findSessions).mockResolvedValue({ sessions, total: 2 })

    const result = await service.getSessions('user-1', sessionQuery())

    expect(result).toMatchObject({ total: 2, page: 1, total_pages: 1 })
    expect(result.sessions).toHaveLength(2)
  })

  it('filters by planId when provided', async () => {
    await service.getSessions('user-1', sessionQuery({ planId: 'plan-1' }))

    expect(repository.findSessions).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ planId: 'plan-1' }),
    )
  })

  it('calculates correct total_pages', async () => {
    vi.mocked(repository.findSessions).mockResolvedValue({ sessions: [], total: 123 })

    const result = await service.getSessions('user-1', sessionQuery())

    expect(result.total_pages).toBe(3)
  })

  it('returns session by id', async () => {
    vi.mocked(repository.findSessionById).mockResolvedValue(
      makeSession({ id: 'session-1' }),
    )

    const result = await service.getSessionById('session-1', 'user-1')

    expect(result.id).toBe('session-1')
  })

  it('propagates repository access errors', async () => {
    vi.mocked(repository.findSessionById).mockRejectedValueOnce(
      new NotFoundError('Sesion no encontrada'),
    )
    await expect(service.getSessionById('bad-id', 'user-1')).rejects.toThrow(
      NotFoundError,
    )

    vi.mocked(repository.findSessionById).mockRejectedValueOnce(new ForbiddenError())
    await expect(service.getSessionById('session-1', 'other-user')).rejects.toThrow(
      ForbiddenError,
    )
  })

  it('creates, updates and deletes sessions', async () => {
    vi.mocked(repository.createSession).mockResolvedValue(
      makeSession({ title: 'New Session' }),
    )
    vi.mocked(repository.updateSession).mockResolvedValue(
      makeSession({ status: 'completed' }),
    )

    await expect(createSession(service)).resolves.toMatchObject({
      title: 'New Session',
    })
    await expect(
      service.updateSession('session-1', 'user-1', { status: 'completed' }),
    ).resolves.toMatchObject({ status: 'completed' })
    await service.deleteSession('session-1', 'user-1')

    expect(repository.deleteSession).toHaveBeenCalledWith('session-1', 'user-1')
  })
})

function sessionQuery(overrides = {}) {
  return { limit: 50, offset: 0, orderBy: 'start_time', orderDirection: 'asc', ...overrides } as const
}

function createSession(service: StudyPlannerService) {
  return service.createSession('user-1', {
    planId: 'plan-1',
    title: 'New Session',
    startTime: '2026-04-10T09:00:00Z',
    endTime: '2026-04-10T10:00:00Z',
  })
}
