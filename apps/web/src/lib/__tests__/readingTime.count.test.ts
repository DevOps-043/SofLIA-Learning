import { describe, expect, it } from 'vitest'
import { countWords } from '../utils/readingTime'

describe('countWords', () => {
  it('returns 0 for empty, invalid, or whitespace-only values', () => {
    expect(countWords('')).toBe(0)
    expect(countWords(null as unknown as string)).toBe(0)
    expect(countWords(undefined as unknown as string)).toBe(0)
    expect(countWords('   ')).toBe(0)
    expect(countWords('\n\t')).toBe(0)
  })

  it('counts words separated by regular and mixed whitespace', () => {
    expect(countWords('hello')).toBe(1)
    expect(countWords('hello world')).toBe(2)
    expect(countWords('one two three four')).toBe(4)
    expect(countWords('hello   world')).toBe(2)
    expect(countWords('hello\nworld')).toBe(2)
    expect(countWords('hello\tworld')).toBe(2)
    expect(countWords('word1\n\n word2 \t word3')).toBe(3)
  })

  it('counts longer text accurately', () => {
    const text = Array.from({ length: 100 }, (_, index) => `word${index}`).join(' ')

    expect(countWords(text)).toBe(100)
  })
})
