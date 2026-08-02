import { describe, expect, it } from 'vitest'

import { describeAiProviderError, isAiProviderBadRequest } from '../ai-error'

describe('describeAiProviderError', () => {
  it('extrae el detalle cuando el SDK anida el error de Google', () => {
    const details = describeAiProviderError({
      error: {
        code: 400,
        message: 'Invalid JSON payload received. Unknown name "additionalProperties".',
        status: 'INVALID_ARGUMENT',
        details: [{ reason: 'INVALID_SCHEMA' }],
      },
    })

    expect(details.httpStatus).toBe(400)
    expect(details.apiStatus).toBe('INVALID_ARGUMENT')
    expect(details.reason).toBe('INVALID_SCHEMA')
    expect(details.message).toContain('Invalid JSON payload')
  })

  it('recupera el cuerpo embebido como JSON dentro del mensaje', () => {
    const error = new Error(
      '[400 Bad Request] {"error":{"code":400,"status":"INVALID_ARGUMENT","message":"Request contains an invalid argument."}}',
    )

    const details = describeAiProviderError(error)

    expect(details.httpStatus).toBe(400)
    expect(details.apiStatus).toBe('INVALID_ARGUMENT')
    expect(details.message).toBe('Request contains an invalid argument.')
  })

  it('deduce el código HTTP del texto cuando no hay cuerpo estructurado', () => {
    const details = describeAiProviderError(new Error('[429 Too Many Requests] quota exceeded'))

    expect(details.httpStatus).toBe(429)
  })

  it('recorta el mensaje para que un eco del input no acabe entero en los logs', () => {
    const details = describeAiProviderError(new Error('x'.repeat(1_000)))

    expect(details.message.length).toBeLessThanOrEqual(300)
  })

  it('no rompe con errores desconocidos', () => {
    expect(describeAiProviderError(null)).toEqual({
      apiStatus: null,
      httpStatus: null,
      message: '',
      reason: null,
    })
  })
})

describe('isAiProviderBadRequest', () => {
  it('detecta un 400 por código y por estado canónico', () => {
    expect(isAiProviderBadRequest(new Error('[400 Bad Request] nope'))).toBe(true)
    expect(isAiProviderBadRequest({ error: { status: 'INVALID_ARGUMENT' } })).toBe(true)
  })

  it('no marca como 400 otros fallos', () => {
    expect(isAiProviderBadRequest(new Error('[503 Service Unavailable]'))).toBe(false)
  })
})
