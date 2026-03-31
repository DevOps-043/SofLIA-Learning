import { describe, it, expect } from 'vitest'
import {
  isDangerousKey,
  sanitizeObject,
  safeMerge,
  safeAssign,
  isObjectSafe,
  validateObject,
} from '../safe-merge'

describe('isDangerousKey', () => {
  it('returns true for __proto__', () => {
    expect(isDangerousKey('__proto__')).toBe(true)
  })

  it('returns true for constructor', () => {
    expect(isDangerousKey('constructor')).toBe(true)
  })

  it('returns true for prototype', () => {
    expect(isDangerousKey('prototype')).toBe(true)
  })

  it('returns true for __defineGetter__', () => {
    expect(isDangerousKey('__defineGetter__')).toBe(true)
  })

  it('returns false for normal keys', () => {
    expect(isDangerousKey('name')).toBe(false)
    expect(isDangerousKey('email')).toBe(false)
    expect(isDangerousKey('id')).toBe(false)
    expect(isDangerousKey('__proto2__')).toBe(false)
  })
})

describe('sanitizeObject', () => {
  it('removes __proto__ key', () => {
    const obj = { name: 'John', __proto__: { isAdmin: true } } as Record<string, unknown>
    const result = sanitizeObject(obj)
    expect(result).not.toHaveProperty('__proto__')
    expect(result.name).toBe('John')
  })

  it('removes constructor key', () => {
    const obj = { name: 'safe', constructor: () => {} } as Record<string, unknown>
    const result = sanitizeObject(obj)
    expect(result).not.toHaveProperty('constructor')
    expect(result.name).toBe('safe')
  })

  it('preserves normal properties', () => {
    const obj = { id: 1, email: 'test@test.com', active: true }
    const result = sanitizeObject(obj)
    expect(result.id).toBe(1)
    expect(result.email).toBe('test@test.com')
    expect(result.active).toBe(true)
  })

  it('sanitizes nested objects recursively', () => {
    const obj = {
      user: { name: 'John', __proto__: { isAdmin: true } }
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

describe('safeMerge', () => {
  it('merges two objects', () => {
    const base = { a: 1, b: 2 }
    const source = { b: 3, c: 4 }
    const result = safeMerge(base, source)
    expect(result).toEqual({ a: 1, b: 3, c: 4 })
  })

  it('does not pollute prototype with __proto__', () => {
    const base = { a: 1 }
    const malicious = { __proto__: { isAdmin: true } } as Record<string, unknown>
    const result = safeMerge(base, malicious)
    expect(result.a).toBe(1)
    expect((result as Record<string, unknown>).isAdmin).toBeUndefined()
  })

  it('does not pollute prototype with constructor', () => {
    const base = { a: 1 }
    const malicious = { constructor: { prototype: { isAdmin: true } } } as Record<string, unknown>
    const result = safeMerge(base, malicious)
    expect((result as Record<string, unknown>).isAdmin).toBeUndefined()
  })

  it('ignores null and undefined sources', () => {
    const base = { a: 1 }
    const result = safeMerge(base, null, undefined, { b: 2 })
    expect(result).toEqual({ a: 1, b: 2 })
  })

  it('merges multiple sources in order', () => {
    const base = { a: 1, b: 2 }
    const s1 = { b: 10, c: 3 }
    const s2 = { c: 30, d: 4 }
    const result = safeMerge(base, s1, s2)
    expect(result).toEqual({ a: 1, b: 10, c: 30, d: 4 })
  })
})

describe('safeAssign', () => {
  it('assigns properties to target', () => {
    const target = { a: 1 }
    const result = safeAssign(target, { b: 2 }, { c: 3 })
    expect(result.a).toBe(1)
    expect((result as Record<string, unknown>).b).toBe(2)
    expect((result as Record<string, unknown>).c).toBe(3)
  })

  it('blocks __proto__ injection', () => {
    const target = { a: 1 }
    const malicious = { __proto__: { isAdmin: true } } as Record<string, unknown>
    safeAssign(target, malicious)
    expect((target as Record<string, unknown>).isAdmin).toBeUndefined()
  })

  it('returns the same target reference', () => {
    const target = { a: 1 }
    const result = safeAssign(target, { b: 2 })
    expect(result).toBe(target)
  })
})

describe('isObjectSafe', () => {
  it('returns true for safe objects', () => {
    expect(isObjectSafe({ name: 'John', email: 'john@example.com' })).toBe(true)
    expect(isObjectSafe({ id: 1, active: true })).toBe(true)
  })

  it('returns false for objects with __proto__ as own property (from JSON.parse)', () => {
    // Note: literal { __proto__: ... } sets the prototype, not an own property.
    // Actual prototype pollution comes from JSON.parse or external data.
    const obj = JSON.parse('{"__proto__": {"isAdmin": true}}') as Record<string, unknown>
    expect(isObjectSafe(obj)).toBe(false)
  })

  it('returns false for objects with constructor key', () => {
    const obj = { constructor: () => {} } as Record<string, unknown>
    expect(isObjectSafe(obj)).toBe(false)
  })

  it('returns true for non-object values', () => {
    expect(isObjectSafe(null as unknown as Record<string, unknown>)).toBe(true)
    expect(isObjectSafe('string' as unknown as Record<string, unknown>)).toBe(true)
  })

  it('recursively checks nested objects', () => {
    const obj = { user: JSON.parse('{"__proto__": {"isAdmin": true}}') } as Record<string, unknown>
    expect(isObjectSafe(obj)).toBe(false)
  })
})

describe('validateObject', () => {
  it('does not throw for safe objects', () => {
    expect(() => validateObject({ name: 'John', role: 'user' })).not.toThrow()
  })

  it('throws for objects with dangerous keys', () => {
    const obj = JSON.parse('{"__proto__": {"isAdmin": true}}') as Record<string, unknown>
    expect(() => validateObject(obj)).toThrow('Prototype Pollution')
  })

  it('includes context in error message when provided', () => {
    const obj = { constructor: () => {} } as Record<string, unknown>
    expect(() => validateObject(obj, 'user input')).toThrow('user input')
  })
})
