import { describe, expect, it } from 'vitest'
import {
  READING_SPEEDS,
  calculateReadingTimeDetailed,
  calculateReadingTimeMinutes,
  getReadingTimeInfo,
} from '../utils/readingTime'

const words = (count: number): string =>
  Array.from({ length: count }, () => 'word').join(' ')

describe('calculateReadingTimeMinutes', () => {
  it('returns at least 1 minute and uses slow speed by default', () => {
    expect(calculateReadingTimeMinutes('')).toBe(1)
    expect(calculateReadingTimeMinutes('hi')).toBeGreaterThanOrEqual(1)
    expect(calculateReadingTimeMinutes(words(180))).toBe(1)
    expect(calculateReadingTimeMinutes('a b c')).toBe(1)
  })

  it('uses reading speed and rounded whole minutes', () => {
    const slow = calculateReadingTimeMinutes(words(500), 'slow')
    const fast = calculateReadingTimeMinutes(words(500), 'fast')
    const rounded = calculateReadingTimeMinutes(words(360), 'slow')

    expect(fast).toBeLessThanOrEqual(slow)
    expect(Number.isInteger(rounded)).toBe(true)
    expect(rounded).toBe(2)
  })
})

describe('calculateReadingTimeDetailed', () => {
  it('returns full details for empty and short text', () => {
    const empty = calculateReadingTimeDetailed('')
    const short = calculateReadingTimeDetailed('hello')

    expect(empty).toMatchObject({
      wordCount: 0,
      estimatedMinutes: 1,
      exactMinutes: 0,
      formattedTime: '~1 min',
    })
    expect(short.estimatedMinutes).toBeGreaterThanOrEqual(1)
  })

  it('calculates counts, precision, and selected speed', () => {
    const result = calculateReadingTimeDetailed('one two three four five')
    const halfMinute = calculateReadingTimeDetailed(words(90), 'slow')
    const fast = calculateReadingTimeDetailed('hello world', 'fast')

    expect(result.wordCount).toBe(5)
    expect(halfMinute.exactMinutes).toBe(0.5)
    expect(fast.speedUsed).toBe(READING_SPEEDS.fast)
  })

  it('formats minute and hour durations', () => {
    expect(calculateReadingTimeDetailed(words(180), 'slow').formattedTime).toMatch(/min/)
    expect(calculateReadingTimeDetailed(words(10800), 'slow').formattedTime).toContain('h')
    expect(calculateReadingTimeDetailed(words(21600), 'slow').formattedTime).toBe('~2h')
  })
})

describe('getReadingTimeInfo', () => {
  it('matches detailed calculation with slow speed', () => {
    const text = 'Hello world this is a test'
    const fromInfo = getReadingTimeInfo(text)
    const fromDetailed = calculateReadingTimeDetailed(text, 'slow')

    expect(fromInfo.wordCount).toBe(fromDetailed.wordCount)
    expect(fromInfo.estimatedMinutes).toBe(fromDetailed.estimatedMinutes)
    expect(fromInfo.formattedTime).toBe(fromDetailed.formattedTime)
  })
})
