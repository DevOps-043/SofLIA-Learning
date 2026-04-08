import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resolvePlanSelectionForChat } from '../plan-resolution.service'
import { listUserStudyPlans } from '@/features/study-planner/services/study-planner-plans.server.service'
import type { ListedStudyPlan } from '@/features/study-planner/services/study-planner-plans.server.service'

vi.mock('@/lib/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('@/features/study-planner/services/study-planner-plans.server.service', () => ({
  listUserStudyPlans: vi.fn(),
}))

const makePlan = (overrides: Partial<ListedStudyPlan> = {}): ListedStudyPlan => ({
  id: 'plan-1',
  name: 'Plan Principal',
  courseIds: [],
  totalSessions: 5,
  completedSessions: 1,
  upcomingSessions: 4,
  ...overrides,
})

describe('resolvePlanSelectionForChat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns no_plans when user has no plans', async () => {
    vi.mocked(listUserStudyPlans).mockResolvedValue([])

    const result = await resolvePlanSelectionForChat({ userId: 'u1' })

    expect(result.status).toBe('no_plans')
    expect(result.plan).toBeUndefined()
    expect(result.allPlans).toHaveLength(0)
  })

  it('returns resolved with the single plan when user has exactly one', async () => {
    const plan = makePlan()
    vi.mocked(listUserStudyPlans).mockResolvedValue([plan])

    const result = await resolvePlanSelectionForChat({ userId: 'u1' })

    expect(result.status).toBe('resolved')
    expect(result.plan?.id).toBe('plan-1')
  })

  it('ignores activePlanId when user has exactly one plan', async () => {
    const plan = makePlan()
    vi.mocked(listUserStudyPlans).mockResolvedValue([plan])

    const result = await resolvePlanSelectionForChat({
      userId: 'u1',
      activePlanId: 'some-other-id',
    })

    expect(result.status).toBe('resolved')
    expect(result.plan?.id).toBe('plan-1')
  })

  it('resolves correctly when activePlanId matches one of multiple plans', async () => {
    const planA = makePlan({ id: 'plan-a', name: 'Plan A' })
    const planB = makePlan({ id: 'plan-b', name: 'Plan B' })
    vi.mocked(listUserStudyPlans).mockResolvedValue([planA, planB])

    const result = await resolvePlanSelectionForChat({
      userId: 'u1',
      activePlanId: 'plan-b',
    })

    expect(result.status).toBe('resolved')
    expect(result.plan?.id).toBe('plan-b')
    expect(result.allPlans).toHaveLength(2)
  })

  it('returns needs_plan_selection when multiple plans exist and no activePlanId', async () => {
    const planA = makePlan({ id: 'plan-a', name: 'Plan A' })
    const planB = makePlan({ id: 'plan-b', name: 'Plan B' })
    vi.mocked(listUserStudyPlans).mockResolvedValue([planA, planB])

    const result = await resolvePlanSelectionForChat({ userId: 'u1' })

    expect(result.status).toBe('needs_plan_selection')
    expect(result.plan).toBeUndefined()
    expect(result.selectionPrompt).toContain('Plan A')
    expect(result.selectionPrompt).toContain('Plan B')
  })

  it('returns needs_plan_selection when activePlanId does not match any plan', async () => {
    const planA = makePlan({ id: 'plan-a', name: 'Plan A' })
    const planB = makePlan({ id: 'plan-b', name: 'Plan B' })
    vi.mocked(listUserStudyPlans).mockResolvedValue([planA, planB])

    const result = await resolvePlanSelectionForChat({
      userId: 'u1',
      activePlanId: 'plan-does-not-exist',
    })

    expect(result.status).toBe('needs_plan_selection')
    expect(result.plan).toBeUndefined()
  })

  it('includes primary course title in selection prompt when available', async () => {
    const planA = makePlan({ id: 'plan-a', name: 'Plan A', primaryCourseTitle: 'React Avanzado' })
    const planB = makePlan({ id: 'plan-b', name: 'Plan B' })
    vi.mocked(listUserStudyPlans).mockResolvedValue([planA, planB])

    const result = await resolvePlanSelectionForChat({ userId: 'u1' })

    expect(result.selectionPrompt).toContain('React Avanzado')
  })

  it('propagates errors from listUserStudyPlans', async () => {
    vi.mocked(listUserStudyPlans).mockRejectedValue(new Error('DB error'))

    await expect(
      resolvePlanSelectionForChat({ userId: 'u1' }),
    ).rejects.toThrow('DB error')
  })
})
