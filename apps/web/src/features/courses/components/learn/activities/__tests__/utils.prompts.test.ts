import { describe, expect, it } from 'vitest'
import { extractPromptList } from '../utils'

describe('extractPromptList', () => {
  it('returns an empty list for nullish or blank input', () => {
    expect(extractPromptList(null)).toEqual([])
    expect(extractPromptList(undefined)).toEqual([])
    expect(extractPromptList('')).toEqual([])
  })

  it('parses JSON arrays and single JSON strings', () => {
    expect(extractPromptList('["Prompt A", "Prompt B"]')).toEqual(['Prompt A', 'Prompt B'])
    expect(extractPromptList('"A prompt"')).toEqual(['A prompt'])
  })

  it('wraps plain text in a list', () => {
    expect(extractPromptList('Single prompt text')).toEqual(['Single prompt text'])
  })

  it('normalizes arrays by trimming quotes, whitespace, and empty values', () => {
    const result = extractPromptList(['"quoted prompt"', "'another'", '', '  ', null])

    expect(result).toEqual(['quoted prompt', 'another'])
  })

  it('stringifies non-string entries consistently', () => {
    const result = extractPromptList([{ text: 'obj' }])

    expect(result.length).toBeGreaterThan(0)
  })
})
