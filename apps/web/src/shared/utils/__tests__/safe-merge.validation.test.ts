import { describe, expect, it } from 'vitest'
import { isObjectSafe, validateObject } from '../safe-merge'

describe('isObjectSafe', () => {
  it('returns true for safe objects and non-object values', () => {
    expect(isObjectSafe({ name: 'John', email: 'john@example.com' })).toBe(true)
    expect(isObjectSafe(null as unknown as Record<string, unknown>)).toBe(true)
    expect(isObjectSafe('string' as unknown as Record<string, unknown>)).toBe(true)
  })

  it('returns false for dangerous own properties', () => {
    const obj = JSON.parse('{"__proto__":{"isAdmin":true}}') as Record<string, unknown>

    expect(isObjectSafe(obj)).toBe(false)
    expect(isObjectSafe({ constructor: () => {} } as Record<string, unknown>)).toBe(false)
  })

  it('recursively checks nested objects', () => {
    const obj = { user: JSON.parse('{"__proto__":{"isAdmin":true}}') } as Record<string, unknown>

    expect(isObjectSafe(obj)).toBe(false)
  })
})

describe('validateObject', () => {
  it('does not throw for safe objects', () => {
    expect(() => validateObject({ name: 'John', role: 'user' })).not.toThrow()
  })

  it('throws with context when dangerous keys are present', () => {
    const obj = JSON.parse('{"__proto__":{"isAdmin":true}}') as Record<string, unknown>
    const withConstructor = { constructor: () => {} } as Record<string, unknown>

    expect(() => validateObject(obj)).toThrow('Prototype Pollution')
    expect(() => validateObject(withConstructor, 'user input')).toThrow('user input')
  })
})
