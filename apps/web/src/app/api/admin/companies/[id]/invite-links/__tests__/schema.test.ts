import { describe, expect, it } from 'vitest'
import { inviteLinkCreateSchema } from '../schema'

describe('inviteLinkCreateSchema', () => {
  it('accepts a valid create payload', () => {
    const result = inviteLinkCreateSchema.safeParse({
      name: 'Equipo ventas',
      maxUses: 25,
      role: 'member',
      expiresAt: '2099-06-30T12:00:00.000Z',
    })

    expect(result.success).toBe(true)
  })

  it('rejects invalid roles', () => {
    const result = inviteLinkCreateSchema.safeParse({
      maxUses: 25,
      role: 'super-admin',
      expiresAt: '2099-06-30T12:00:00.000Z',
    })

    expect(result.success).toBe(false)
  })

  it('rejects owner bearer links', () => {
    const result = inviteLinkCreateSchema.safeParse({
      maxUses: 25,
      role: 'owner',
      expiresAt: '2099-06-30T12:00:00.000Z',
    })

    expect(result.success).toBe(false)
  })

  it('rejects admin bearer links', () => {
    const result = inviteLinkCreateSchema.safeParse({
      maxUses: 25,
      role: 'admin',
      expiresAt: '2099-06-30T12:00:00.000Z',
    })

    expect(result.success).toBe(false)
  })

  it('rejects non-future expiration dates', () => {
    const result = inviteLinkCreateSchema.safeParse({
      maxUses: 25,
      role: 'member',
      expiresAt: '2020-06-30T12:00:00.000Z',
    })

    expect(result.success).toBe(false)
  })

  it('rejects unknown fields', () => {
    const result = inviteLinkCreateSchema.safeParse({
      maxUses: 25,
      role: 'member',
      expiresAt: '2099-06-30T12:00:00.000Z',
      organizationId: 'not-allowed',
    })

    expect(result.success).toBe(false)
  })
})
