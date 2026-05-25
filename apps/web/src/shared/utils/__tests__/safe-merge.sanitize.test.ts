import { describe, expect, it } from 'vitest'
import { createSafeObject, sanitizeObject } from '../safe-merge'

describe('sanitizeObject', () => {
  it('removes dangerous keys while preserving normal properties', () => {
    const obj = { name: 'safe', constructor: () => {}, active: true } as Record<string, unknown>
    const result = sanitizeObject(obj)

    expect(result).not.toHaveProperty('constructor')
    expect(result.name).toBe('safe')
    expect(result.active).toBe(true)
  })

  it('sanitizes nested objects recursively', () => {
    const obj = {
      user: JSON.parse('{"name":"John","__proto__":{"isAdmin":true}}'),
    } as Record<string, unknown>

    const result = sanitizeObject(obj)
    const nested = result.user as Record<string, unknown>

    expect(nested).not.toHaveProperty('__proto__')
    expect(nested.name).toBe('John')
  })

  it('handles non-object values gracefully', () => {
    expect(sanitizeObject(null as unknown as Record<string, unknown>)).toBeNull()
    expect(sanitizeObject('string' as unknown as Record<string, unknown>)).toBe('string')
  })
})

describe('createSafeObject', () => {
  it('returns an object without dangerous keys', () => {
    const safe = createSafeObject(
      JSON.parse('{"name":"John","__proto__":{"isAdmin":true}}') as Record<string, unknown>,
    )

    expect(Object.getPrototypeOf(safe)).toBeNull()
    expect(safe).not.toHaveProperty('__proto__')
    expect(safe.name).toBe('John')
  })
})
