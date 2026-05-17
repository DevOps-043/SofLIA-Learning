import { beforeEach, describe, expect, it, vi } from 'vitest'

import { StudyPlannerService } from '../study-planner.service'
import type { StudyPlannerRepository } from '../study-planner.repository'
import { makePlan, makeRepository } from './study-planner.fixtures'

describe('StudyPlannerService plans', () => {
  let service: StudyPlannerService
  let repository: StudyPlannerRepository

  beforeEach(() => {
    vi.clearAllMocks()
    repository = makeRepository()
    service = new StudyPlannerService(repository)
  })

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

  it('creates a new study plan', async () => {
    vi.mocked(repository.createPlan).mockResolvedValue(
      makePlan({ title: 'New Plan' }),
    )

    const result = await service.createPlan('user-1', {
      title: 'New Plan',
      startDate: '2026-04-01',
      endDate: '2026-04-30',
      dailyStudyMinutes: 60,
    })

    expect(result.title).toBe('New Plan')
  })
})
