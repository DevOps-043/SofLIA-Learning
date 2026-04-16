import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../lesson-distribution.service', () => ({
  filterHolidayLessonDistributions: vi.fn((schedules) => schedules),
  mergeLessonDistributions: vi.fn((_existing, extracted) => extracted),
  shouldReplaceLessonDistribution: vi.fn(() => false),
}))

vi.mock('../planner-guardrails.service', () => ({
  sanitizePlannerAssistantResponse: vi.fn((response: string) => response),
  shouldMarkFinalSummaryFromResponse: vi.fn(() => false),
  shouldOpenCourseSelectorFromResponse: vi.fn(() => false),
  shouldTriggerPlannerFinalSave: vi.fn(() => false),
}))

vi.mock('../plan-parser.service', () => ({
  parseLiaResponseToSchedules: vi.fn(() => []),
}))

import { processStudyPlannerChatResponse } from '../planner-chat-response.service'
import type { ProcessStudyPlannerChatResponseParams } from '../planner-chat-response.service'
import { parseLiaResponseToSchedules } from '../plan-parser.service'
import { mergeLessonDistributions } from '../lesson-distribution.service'
import {
  shouldMarkFinalSummaryFromResponse,
  shouldOpenCourseSelectorFromResponse,
} from '../planner-guardrails.service'

function makeParams(
  overrides: Partial<ProcessStudyPlannerChatResponseParams> = {},
): ProcessStudyPlannerChatResponseParams {
  return {
    liaResponse: 'Here is your study plan.',
    savedLessonDistribution: [],
    isAddingSchedules: false,
    isConfirmingSchedules: false,
    hasShownFinalSummary: false,
    ...overrides,
  }
}

describe('processStudyPlannerChatResponse', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns sanitized response', () => {
    const result = processStudyPlannerChatResponse(makeParams())
    expect(result.sanitizedResponse).toBe('Here is your study plan.')
  })

  it('returns empty schedules when parser finds none', () => {
    const result = processStudyPlannerChatResponse(makeParams())
    expect(result.hasExtractedSchedules).toBe(false)
    expect(result.nextSavedLessonDistribution).toEqual([])
  })

  it('merges extracted schedules when parser finds some', () => {
    const mockSchedule = { day: 'lunes', lessons: ['l1'] }
    vi.mocked(parseLiaResponseToSchedules).mockReturnValue([mockSchedule as never])

    const result = processStudyPlannerChatResponse(makeParams())

    expect(result.hasExtractedSchedules).toBe(true)
    expect(mergeLessonDistributions).toHaveBeenCalled()
  })

  it('marks final summary shown when confirming and guardrail says yes', () => {
    vi.mocked(shouldMarkFinalSummaryFromResponse).mockReturnValue(true)

    const result = processStudyPlannerChatResponse(
      makeParams({ isConfirmingSchedules: true, hasShownFinalSummary: false }),
    )

    expect(result.shouldMarkFinalSummaryShown).toBe(true)
  })

  it('does not mark final summary if already shown', () => {
    vi.mocked(shouldMarkFinalSummaryFromResponse).mockReturnValue(true)

    const result = processStudyPlannerChatResponse(
      makeParams({ isConfirmingSchedules: true, hasShownFinalSummary: true }),
    )

    expect(result.shouldMarkFinalSummaryShown).toBe(false)
  })

  it('does not mark final summary if not confirming', () => {
    vi.mocked(shouldMarkFinalSummaryFromResponse).mockReturnValue(true)

    const result = processStudyPlannerChatResponse(
      makeParams({ isConfirmingSchedules: false }),
    )

    expect(result.shouldMarkFinalSummaryShown).toBe(false)
  })

  it('detects when course selector should open', () => {
    vi.mocked(shouldOpenCourseSelectorFromResponse).mockReturnValue(true)

    const result = processStudyPlannerChatResponse(makeParams())

    expect(result.shouldOpenCourseSelector).toBe(true)
  })

  it('preserves existing distributions when no new schedules extracted', () => {
    const existing = [{ day: 'martes', lessons: ['l5'] }]

    const result = processStudyPlannerChatResponse(
      makeParams({ savedLessonDistribution: existing as never[] }),
    )

    expect(result.nextSavedLessonDistribution).toEqual(existing)
  })
})
