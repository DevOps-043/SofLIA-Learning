import { describe, expect, it } from 'vitest'

import { createPersonalizationErrorResponse } from '../personalization.errors'

describe('personalization error responses', () => {
  it('does not expose provider or database messages in a server error', async () => {
    const response = createPersonalizationErrorResponse(
      new Error('sensitive database policy details'),
      'Error al obtener configuración',
    )
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload).toEqual({
      error: 'Error al obtener configuración',
      success: false,
    })
    expect(JSON.stringify(payload)).not.toContain('database')
  })
})
