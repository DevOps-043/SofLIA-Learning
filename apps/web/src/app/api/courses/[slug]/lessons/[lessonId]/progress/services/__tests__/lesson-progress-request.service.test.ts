import { describe, expect, it } from 'vitest'
import { parseLessonProgressRequestBody } from '../lesson-progress-request.service'

describe('lesson-progress-request.service', () => {
  it('accepts an empty body', () => {
    expect(parseLessonProgressRequestBody('')).toEqual({ data: {} })
    expect(parseLessonProgressRequestBody('   ')).toEqual({ data: {} })
  })

  it('rejects invalid json payloads', () => {
    expect(parseLessonProgressRequestBody('{')).toEqual({
      error: {
        error: 'El cuerpo de la solicitud debe ser JSON valido',
        status: 400,
      },
    })
  })

  it('rejects unexpected fields', () => {
    const result = parseLessonProgressRequestBody(
      JSON.stringify({ force: true }),
    )

    expect(result.error?.error).toBe('La solicitud no acepta campos adicionales')
    expect(result.error?.status).toBe(400)
  })
})
