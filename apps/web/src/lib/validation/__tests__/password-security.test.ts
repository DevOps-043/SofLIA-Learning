import { describe, it, expect } from 'vitest'
import {
  isCommonPassword,
  hasDangerousPattern,
  containsPersonalInfo,
  calculatePasswordEntropy,
  calculatePasswordScore,
  getPasswordStrengthLevel,
  validatePassword,
  generateSecurePassword,
  PASSWORD_REQUIREMENTS,
  PasswordStrength,
} from '../password-security'

describe('isCommonPassword', () => {
  it('returns true for common passwords', () => {
    expect(isCommonPassword('password')).toBe(true)
    expect(isCommonPassword('123456')).toBe(true)
    expect(isCommonPassword('qwerty')).toBe(true)
    expect(isCommonPassword('admin')).toBe(true)
    expect(isCommonPassword('letmein')).toBe(true)
  })

  it('returns true for common passwords with uppercase', () => {
    expect(isCommonPassword('PASSWORD')).toBe(true)
    expect(isCommonPassword('Admin')).toBe(true)
  })

  it('returns true for common base with numbers appended', () => {
    expect(isCommonPassword('password123')).toBe(true)
    expect(isCommonPassword('admin123')).toBe(true)
  })

  it('returns false for strong unique passwords', () => {
    expect(isCommonPassword('X9#mK2$pL7@qN3')).toBe(false)
    expect(isCommonPassword('Tr0ub4dor&3')).toBe(false)
  })
})

describe('hasDangerousPattern', () => {
  it('detects repeated character patterns', () => {
    expect(hasDangerousPattern('aaaaaaa')).toBe(true)
    expect(hasDangerousPattern('1111111')).toBe(true)
  })

  it('detects sequential pair number patterns', () => {
    // Pattern: pairs like 12, 34, 56 must cover the whole string
    expect(hasDangerousPattern('1234')).toBe(true)
    expect(hasDangerousPattern('567890')).toBe(true)
  })

  it('detects keyboard walk patterns (full match)', () => {
    expect(hasDangerousPattern('qwert')).toBe(true)
    expect(hasDangerousPattern('asdf')).toBe(true)
    expect(hasDangerousPattern('qwertwerty')).toBe(true)
  })

  it('returns false for passwords without dangerous patterns', () => {
    expect(hasDangerousPattern('X9#mK2$pL7')).toBe(false)
    expect(hasDangerousPattern('MyDogName42!')).toBe(false)
  })
})

describe('containsPersonalInfo', () => {
  it('returns true when password contains email username', () => {
    expect(containsPersonalInfo('john1234!', { email: 'john@example.com' })).toBe(true)
  })

  it('returns true when password contains first name', () => {
    expect(containsPersonalInfo('Carlos2024!', { firstName: 'Carlos' })).toBe(true)
  })

  it('returns true when password contains last name', () => {
    expect(containsPersonalInfo('Smith2024!', { lastName: 'Smith' })).toBe(true)
  })

  it('returns true when password contains username', () => {
    expect(containsPersonalInfo('user_jdoe_2024', { username: 'jdoe' })).toBe(true)
  })

  it('returns false when no personal info is provided', () => {
    expect(containsPersonalInfo('SecurePass2024!')).toBe(false)
  })

  it('returns false when password does not contain personal info', () => {
    expect(containsPersonalInfo('X9#mK2$pL7', { email: 'john@example.com', firstName: 'Alice' })).toBe(false)
  })

  it('ignores personal info shorter than 3 characters', () => {
    expect(containsPersonalInfo('abPass2024!', { firstName: 'ab' })).toBe(false)
  })
})

describe('calculatePasswordEntropy', () => {
  it('returns 0 for empty password', () => {
    expect(calculatePasswordEntropy('')).toBe(0)
  })

  it('returns higher entropy for longer passwords', () => {
    const short = calculatePasswordEntropy('abc')
    const long = calculatePasswordEntropy('abcdefghijklmnop')
    expect(long).toBeGreaterThan(short)
  })

  it('returns higher entropy for passwords with more character types', () => {
    const lowerOnly = calculatePasswordEntropy('abcdefgh')
    const mixed = calculatePasswordEntropy('aB1!cD2@')
    expect(mixed).toBeGreaterThan(lowerOnly)
  })

  it('returns a positive number for non-empty passwords', () => {
    expect(calculatePasswordEntropy('password')).toBeGreaterThan(0)
  })
})

describe('calculatePasswordScore', () => {
  it('returns 0 for very weak passwords', () => {
    const score = calculatePasswordScore('abc')
    expect(score).toBeLessThan(30)
  })

  it('returns a high score for strong passwords', () => {
    const score = calculatePasswordScore('X9#mK2$pL7@qN3wZ')
    expect(score).toBeGreaterThan(70)
  })

  it('penalizes common passwords', () => {
    const common = calculatePasswordScore('password')
    const strong = calculatePasswordScore('X9#mK2$pL7')
    expect(strong).toBeGreaterThan(common)
  })
})

describe('getPasswordStrengthLevel', () => {
  it('returns VERY_WEAK for score 0-19', () => {
    expect(getPasswordStrengthLevel(0)).toBe(PasswordStrength.VERY_WEAK)
    expect(getPasswordStrengthLevel(19)).toBe(PasswordStrength.VERY_WEAK)
  })

  it('returns WEAK for score 20-39', () => {
    expect(getPasswordStrengthLevel(20)).toBe(PasswordStrength.WEAK)
    expect(getPasswordStrengthLevel(39)).toBe(PasswordStrength.WEAK)
  })

  it('returns FAIR for score 40-59', () => {
    expect(getPasswordStrengthLevel(40)).toBe(PasswordStrength.FAIR)
    expect(getPasswordStrengthLevel(59)).toBe(PasswordStrength.FAIR)
  })

  it('returns STRONG for score 60-79', () => {
    expect(getPasswordStrengthLevel(60)).toBe(PasswordStrength.STRONG)
    expect(getPasswordStrengthLevel(79)).toBe(PasswordStrength.STRONG)
  })

  it('returns VERY_STRONG for score 80+', () => {
    expect(getPasswordStrengthLevel(80)).toBe(PasswordStrength.VERY_STRONG)
    expect(getPasswordStrengthLevel(100)).toBe(PasswordStrength.VERY_STRONG)
  })
})

describe('validatePassword', () => {
  it('returns valid for a strong password', () => {
    const result = validatePassword('X9#mK2$pL7@qN3wZ')
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('fails for password that is too short', () => {
    const result = validatePassword('Ab1!')
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('fails for password without uppercase', () => {
    const result = validatePassword('lowercase1234!@#')
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.toLowerCase().includes('mayúscula') || e.toLowerCase().includes('upper'))).toBe(true)
  })

  it('fails for a password without special characters', () => {
    const result = validatePassword('XmKpLqNwZ123456')
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.includes('especial') || e.includes('special'))).toBe(true)
  })

  it('returns PasswordStrength enum as strength', () => {
    const result = validatePassword('X9#mK2$pL7@qN3wZ')
    expect(result.score).toBeGreaterThan(0)
    expect(result.strength).toBeDefined()
    expect(Object.values(PasswordStrength)).toContain(result.strength)
  })
})

describe('generateSecurePassword', () => {
  it('generates password of default length 16', () => {
    const password = generateSecurePassword()
    expect(password.length).toBe(16)
  })

  it('generates password of specified length', () => {
    expect(generateSecurePassword(20).length).toBe(20)
    expect(generateSecurePassword(32).length).toBe(32)
  })

  it('generates different passwords on each call', () => {
    const p1 = generateSecurePassword()
    const p2 = generateSecurePassword()
    expect(p1).not.toBe(p2)
  })

  it('generated password passes validation', () => {
    const password = generateSecurePassword(20)
    const result = validatePassword(password)
    expect(result.isValid).toBe(true)
  })

  it('respects minimum length requirement', () => {
    const minLength = PASSWORD_REQUIREMENTS.minLength
    const password = generateSecurePassword(minLength)
    expect(password.length).toBeGreaterThanOrEqual(minLength)
  })
})
