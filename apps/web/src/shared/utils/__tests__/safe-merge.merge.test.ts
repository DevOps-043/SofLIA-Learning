import { describe, expect, it } from 'vitest'
import { safeAssign, safeMerge } from '../safe-merge'

describe('safeMerge', () => {
  it('merges sources in order', () => {
    const result = safeMerge({ a: 1, b: 2 }, { b: 10, c: 3 }, { c: 30, d: 4 })

    expect(result).toEqual({ a: 1, b: 10, c: 30, d: 4 })
  })

  it('ignores null and undefined sources', () => {
    const result = safeMerge({ a: 1 }, null, undefined, { b: 2 })

    expect(result).toEqual({ a: 1, b: 2 })
  })

  it('does not pollute prototype with dangerous keys', () => {
    const result = safeMerge(
      { a: 1 },
      JSON.parse('{"__proto__":{"isAdmin":true},"constructor":{"prototype":{"x":true}}}'),
    )

    expect(result.a).toBe(1)
    expect((result as Record<string, unknown>).isAdmin).toBeUndefined()
    expect((result as Record<string, unknown>).x).toBeUndefined()
  })
})

describe('safeAssign', () => {
  it('assigns safe properties to the target reference', () => {
    const target = { a: 1 }
    const result = safeAssign(target, { b: 2 }, { c: 3 })

    expect(result).toBe(target)
    expect(result.a).toBe(1)
    expect((result as Record<string, unknown>).b).toBe(2)
    expect((result as Record<string, unknown>).c).toBe(3)
  })

  it('blocks prototype pollution during assignment', () => {
    const target = { a: 1 }
    safeAssign(target, JSON.parse('{"__proto__":{"isAdmin":true}}'))

    expect((target as Record<string, unknown>).isAdmin).toBeUndefined()
  })
})
