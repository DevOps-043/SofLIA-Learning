import { describe, expect, it } from 'vitest'
import { isAllowedBusinessRole } from '../business-auth/user.service'

describe('business-auth user service', () => {
  it('keeps business admin routes restricted to Business and Administrador profiles', () => {
    expect(isAllowedBusinessRole('Business', 'business-admin')).toBe(true)
    expect(isAllowedBusinessRole('Administrador', 'business-admin')).toBe(true)
    expect(isAllowedBusinessRole('Business User', 'business-admin')).toBe(false)
  })

  it('allows employee dashboard routes for Business User profiles', () => {
    expect(isAllowedBusinessRole(' Business User ', 'business-user')).toBe(true)
    expect(isAllowedBusinessRole('Business', 'business-user')).toBe(true)
    expect(isAllowedBusinessRole('Administrador', 'business-user')).toBe(true)
    expect(isAllowedBusinessRole('Usuario', 'business-user')).toBe(false)
  })
})
