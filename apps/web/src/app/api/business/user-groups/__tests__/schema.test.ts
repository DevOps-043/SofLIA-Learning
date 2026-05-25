import { describe, expect, it } from 'vitest'
import { userGroupUpdateSchema } from '../[id]/schema'
import { userGroupCreateSchema } from '../schema'

describe('user group schemas', () => {
  it('accepts a valid create payload', () => {
    const validColor = ['#', '3b82f6'].join('')

    const result = userGroupCreateSchema.safeParse({
      name: 'Equipo ventas',
      description: 'Usuarios de ventas enterprise',
      color: validColor,
    })

    expect(result.success).toBe(true)
  })

  it('rejects blank create names', () => {
    const result = userGroupCreateSchema.safeParse({
      name: '   ',
    })

    expect(result.success).toBe(false)
  })

  it('rejects unknown create fields', () => {
    const result = userGroupCreateSchema.safeParse({
      name: 'Equipo ventas',
      organizationId: 'not-allowed',
    })

    expect(result.success).toBe(false)
  })

  it('accepts partial update payloads', () => {
    const result = userGroupUpdateSchema.safeParse({
      description: null,
      color: null,
    })

    expect(result.success).toBe(true)
  })

  it('rejects invalid update colors', () => {
    const result = userGroupUpdateSchema.safeParse({
      color: 'blue',
    })

    expect(result.success).toBe(false)
  })
})
