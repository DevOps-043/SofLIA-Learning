import { describe, expect, it } from 'vitest'
import { resolveContentState } from '../content/content-state'

describe('resolveContentState', () => {
  it('retorna estado exitoso cuando el loader resuelve', async () => {
    const result = await resolveContentState(async () => 'ok')

    expect(result).toEqual({
      data: 'ok',
      loading: false,
      error: null,
    })
  })

  it('retorna estado de error cuando el loader falla', async () => {
    const result = await resolveContentState(async () => {
      throw new Error('boom')
    })

    expect(result).toEqual({
      data: null,
      loading: false,
      error: 'boom',
    })
  })
})
