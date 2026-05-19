import { describe, expect, it } from 'vitest'
import { learningPathCreateSchema } from '../schema'

describe('learningPathCreateSchema', () => {
  it('accepts a valid create payload', () => {
    const result = learningPathCreateSchema.safeParse({
      title: 'Ruta IA para ventas',
      slug: 'ruta-ia-ventas',
      description: 'Ruta corporativa para el equipo comercial',
      is_active: true,
    })

    expect(result.success).toBe(true)
  })

  it('rejects blank titles', () => {
    const result = learningPathCreateSchema.safeParse({
      title: '   ',
    })

    expect(result.success).toBe(false)
  })

  it('rejects unknown fields', () => {
    const result = learningPathCreateSchema.safeParse({
      title: 'Ruta IA para ventas',
      organizationId: 'not-allowed',
    })

    expect(result.success).toBe(false)
  })
})
