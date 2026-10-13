import { afterEach, describe, expect, it, vi } from 'vitest'
import { generationTimeoutBeforeDeadline } from '../generation-deadline'

afterEach(() => vi.restoreAllMocks())

describe('generation deadline', () => {
  it('leaves the existing timeout alone for interactive generation', () => {
    expect(generationTimeoutBeforeDeadline()).toBeUndefined()
  })

  it('caps queue AI time and reserves five seconds for persistence', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_000)
    expect(generationTimeoutBeforeDeadline(25_000)).toBe(12_000)
    expect(generationTimeoutBeforeDeadline(9_000)).toBe(3_000)
    expect(() => generationTimeoutBeforeDeadline(6_000)).toThrow('RUNTIME_BUDGET_EXHAUSTED')
  })
})
