import { describe, expect, it } from 'vitest'
import { learningPathUpdateSchema } from '../schema'

describe('learningPathUpdateSchema', () => {
  it('accepts a valid partial update payload', () => {
    const result = learningPathUpdateSchema.safeParse({
      title: 'Ruta IA actualizada',
      is_active: false,
    })

    expect(result.success).toBe(true)
  })

  it('rejects blank titles', () => {
    const result = learningPathUpdateSchema.safeParse({
      title: '   ',
    })

    expect(result.success).toBe(false)
  })

  it('rejects unknown fields', () => {
    const result = learningPathUpdateSchema.safeParse({
      title: 'Ruta IA actualizada',
      ownerId: 'not-allowed',
    })

    expect(result.success).toBe(false)
  })
})
