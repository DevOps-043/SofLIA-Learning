import { describe, expect, it } from 'vitest'
import { inviteLinkPatchSchema } from '../schema'

describe('inviteLinkPatchSchema', () => {
  it('accepts a valid field update payload', () => {
    const result = inviteLinkPatchSchema.safeParse({
      expiresAt: '2026-06-30T12:00:00.000Z',
      maxUses: 25,
      name: 'Equipo ventas Q2',
    })

    expect(result.success).toBe(true)
  })

  it('rejects unsupported actions', () => {
    const result = inviteLinkPatchSchema.safeParse({ action: 'archive' })

    expect(result.success).toBe(false)
  })

  it('rejects unknown fields to keep the API contract explicit', () => {
    const result = inviteLinkPatchSchema.safeParse({
      name: 'Equipo ventas Q2',
      role: 'Admin',
    })

    expect(result.success).toBe(false)
  })
})
