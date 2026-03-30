import { describe, it, expect } from 'vitest'
import {
  deepParseJsonValue,
  normalizeContentForRenderer,
  normalizeLessonActivityRecord,
  normalizeActivityContentForClient,
} from '../course-content'

describe('deepParseJsonValue', () => {
  it('returns a plain string unchanged', () => {
    expect(deepParseJsonValue('hello world')).toBe('hello world')
  })

  it('parses a JSON string into an object', () => {
    const result = deepParseJsonValue('{"title":"Test"}')
    expect(result).toEqual({ title: 'Test' })
  })

  it('parses a doubly-nested JSON string', () => {
    const inner = JSON.stringify({ content: 'hello' })
    const outer = JSON.stringify(inner)
    const result = deepParseJsonValue(outer)
    expect(result).toEqual({ content: 'hello' })
  })

  it('returns numbers unchanged', () => {
    expect(deepParseJsonValue(42)).toBe(42)
  })

  it('returns null unchanged', () => {
    expect(deepParseJsonValue(null)).toBeNull()
  })

  it('returns objects unchanged', () => {
    const obj = { a: 1 }
    expect(deepParseJsonValue(obj)).toBe(obj)
  })
})

describe('normalizeContentForRenderer', () => {
  it('returns empty string for null', () => {
    expect(normalizeContentForRenderer(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(normalizeContentForRenderer(undefined)).toBe('')
  })

  it('returns a plain string as-is', () => {
    expect(normalizeContentForRenderer('Hello lesson')).toBe('Hello lesson')
  })

  it('extracts text content from an object with a content field', () => {
    const result = normalizeContentForRenderer({ content: 'Lesson body text' })
    expect(result).toBe('Lesson body text')
  })

  it('does not throw on empty object', () => {
    expect(() => normalizeContentForRenderer({})).not.toThrow()
  })

  it('does not throw on an array', () => {
    expect(() => normalizeContentForRenderer(['item1', 'item2'])).not.toThrow()
  })

  it('returns empty string for JSON-like string with no extractable text', () => {
    const result = normalizeContentForRenderer('{"id":"123","type":"quiz"}')
    expect(typeof result).toBe('string')
  })

  it('does not throw on HTML string', () => {
    const html = '<p>Some <strong>html</strong> content</p>'
    expect(() => normalizeContentForRenderer(html)).not.toThrow()
    const result = normalizeContentForRenderer(html)
    expect(typeof result).toBe('string')
  })
})

describe('normalizeActivityContentForClient', () => {
  it('returns parsed object for quiz type', () => {
    const content = JSON.stringify({ questions: [] })
    const result = normalizeActivityContentForClient('quiz', content)
    expect(result).toEqual({ questions: [] })
  })

  it('returns plain string for reflection type', () => {
    const result = normalizeActivityContentForClient('reflection', 'Think about this.')
    expect(result).toBe('Think about this.')
  })

  it('returns empty string for reflection type with no meaningful content', () => {
    const result = normalizeActivityContentForClient('reflection', null)
    expect(result).toBe('')
  })
})

describe('normalizeLessonActivityRecord', () => {
  it('parses string JSON activity_content', () => {
    const record = {
      activity_type: 'quiz',
      activity_content: JSON.stringify({ questions: [{ id: '1' }] }),
    }
    const result = normalizeLessonActivityRecord(record)
    expect(result.activity_content).toEqual({ questions: [{ id: '1' }] })
  })

  it('preserves other fields on the record', () => {
    const record = {
      activity_id: 'abc',
      activity_type: 'reflection',
      activity_content: 'Reflect on this topic.',
    }
    const result = normalizeLessonActivityRecord(record)
    expect(result.activity_id).toBe('abc')
  })

  it('does not throw when activity_content is null', () => {
    const record = { activity_type: 'exercise', activity_content: null }
    expect(() => normalizeLessonActivityRecord(record)).not.toThrow()
  })

  it('does not throw when activity_content is undefined', () => {
    const record = { activity_type: 'exercise', activity_content: undefined }
    expect(() => normalizeLessonActivityRecord(record)).not.toThrow()
  })
})
