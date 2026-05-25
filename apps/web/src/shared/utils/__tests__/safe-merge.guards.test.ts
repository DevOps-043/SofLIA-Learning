import { describe, expect, it } from 'vitest'
import { isDangerousKey } from '../safe-merge'

describe('isDangerousKey', () => {
  it('detects prototype pollution keys', () => {
    expect(isDangerousKey('__proto__')).toBe(true)
    expect(isDangerousKey('constructor')).toBe(true)
    expect(isDangerousKey('prototype')).toBe(true)
    expect(isDangerousKey('__defineGetter__')).toBe(true)
  })

  it('allows normal keys', () => {
    expect(isDangerousKey('name')).toBe(false)
    expect(isDangerousKey('email')).toBe(false)
    expect(isDangerousKey('id')).toBe(false)
    expect(isDangerousKey('__proto2__')).toBe(false)
  })
})
