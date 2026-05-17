import { describe, expect, it } from 'vitest'
import { DEFAULT_READING_SPEED, READING_SPEEDS } from '../utils/readingTime'

describe('READING_SPEEDS', () => {
  it('defines slow, average, and fast speeds in ascending order', () => {
    expect(READING_SPEEDS).toHaveProperty('slow')
    expect(READING_SPEEDS).toHaveProperty('average')
    expect(READING_SPEEDS).toHaveProperty('fast')
    expect(READING_SPEEDS.slow.wordsPerMinute).toBeLessThan(READING_SPEEDS.average.wordsPerMinute)
    expect(READING_SPEEDS.average.wordsPerMinute).toBeLessThan(READING_SPEEDS.fast.wordsPerMinute)
  })

  it('keeps display metadata for every speed', () => {
    for (const speed of ['slow', 'average', 'fast'] as const) {
      expect(typeof READING_SPEEDS[speed].label).toBe('string')
      expect(typeof READING_SPEEDS[speed].description).toBe('string')
    }
  })
})

describe('DEFAULT_READING_SPEED', () => {
  it('uses slow reading for educational content', () => {
    expect(DEFAULT_READING_SPEED).toBe('slow')
  })
})
