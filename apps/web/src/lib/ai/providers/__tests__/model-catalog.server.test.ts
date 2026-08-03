import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const retrieve = vi.fn()
const list = vi.fn()

vi.mock('../openai-client.server', () => ({
  getOpenAiApiKey: () => process.env.OPENAI_API_KEY || null,
  getOpenAiClient: () => ({ models: { list, retrieve } }),
}))

vi.mock('@/lib/utils/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}))

const { checkAiModelExists, clearAiModelCatalogCache } = await import('../model-catalog.server')

/** Error con la forma que expone el SDK de OpenAI. */
function apiError(status: number) {
  return Object.assign(new Error(`HTTP ${status}`), { status })
}

function asyncIterableOf(ids: string[]) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const id of ids) yield { id }
    },
  }
}

describe('checkAiModelExists (OpenAI)', () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'sk-test'
    clearAiModelCatalogCache()
    retrieve.mockReset()
    list.mockReset()
  })

  afterEach(() => {
    delete process.env.OPENAI_API_KEY
  })

  it('confirma un modelo que el proveedor conoce', async () => {
    retrieve.mockResolvedValue({ id: 'gpt-5.6-terra' })

    await expect(checkAiModelExists({ model: 'gpt-5.6-terra', provider: 'openai' })).resolves.toMatchObject({
      status: 'exists',
    })
  })

  it('rechaza una errata y sugiere el nombre correcto', async () => {
    retrieve.mockRejectedValue(apiError(404))
    list.mockReturnValue(asyncIterableOf(['gpt-5.6-terra', 'gpt-4.1', 'o3-mini']))

    const result = await checkAiModelExists({ model: 'gpt-5.6-terrra', provider: 'openai' })

    expect(result.status).toBe('missing')
    expect(result.suggestions).toContain('gpt-5.6-terra')
  })

  /**
   * Invariante de la política: una caída del proveedor no puede impedir cambiar
   * la configuración, que es justo la reacción ante una caída del proveedor.
   */
  it('NO bloquea el guardado cuando no puede preguntar', async () => {
    for (const status of [401, 429, 500]) {
      clearAiModelCatalogCache()
      retrieve.mockRejectedValue(apiError(status))

      const result = await checkAiModelExists({ model: 'gpt-5.6-terra', provider: 'openai' })

      expect(result.status).toBe('unverified')
      expect(result.reason).toContain(String(status))
    }
  })

  it('sin credenciales queda sin verificar, no invalidado', async () => {
    delete process.env.OPENAI_API_KEY

    await expect(checkAiModelExists({ model: 'gpt-5.6-terra', provider: 'openai' })).resolves.toMatchObject({
      reason: 'AI_API_KEY_MISSING:openai',
      status: 'unverified',
    })
    expect(retrieve).not.toHaveBeenCalled()
  })

  it('no pide el catalogo completo cuando el modelo existe', async () => {
    retrieve.mockResolvedValue({ id: 'gpt-5.6-terra' })

    await checkAiModelExists({ model: 'gpt-5.6-terra', provider: 'openai' })

    expect(list).not.toHaveBeenCalled()
  })

  it('cachea el resultado positivo en lugar de repreguntar', async () => {
    retrieve.mockResolvedValue({ id: 'gpt-5.6-terra' })

    await checkAiModelExists({ model: 'gpt-5.6-terra', provider: 'openai' })
    await checkAiModelExists({ model: 'gpt-5.6-terra', provider: 'openai' })

    expect(retrieve).toHaveBeenCalledTimes(1)
  })

  it('nunca cachea un resultado no verificado', async () => {
    retrieve.mockRejectedValue(apiError(503))

    await checkAiModelExists({ model: 'gpt-5.6-terra', provider: 'openai' })
    await checkAiModelExists({ model: 'gpt-5.6-terra', provider: 'openai' })

    expect(retrieve).toHaveBeenCalledTimes(2)
  })
})

describe('checkAiModelExists (Google)', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'gemini-test'
    clearAiModelCatalogCache()
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    delete process.env.GEMINI_API_KEY
    vi.unstubAllGlobals()
  })

  it('confirma un modelo publicado', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 })

    await expect(
      checkAiModelExists({ model: 'gemini-3.5-flash', provider: 'google' }),
    ).resolves.toMatchObject({ status: 'exists' })
  })

  /** La clave en `?key=` acabaría en trazas y registros de red. */
  it('envia la credencial en cabecera, nunca en la URL', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 })

    await checkAiModelExists({ model: 'gemini-3.5-flash', provider: 'google' })

    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).not.toContain('gemini-test')
    expect(init.headers['x-goog-api-key']).toBe('gemini-test')
  })

  it('rechaza un modelo inexistente y sugiere alternativas', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({
        json: async () => ({ models: [{ name: 'models/gemini-3.5-flash' }] }),
        ok: true,
        status: 200,
      })

    const result = await checkAiModelExists({ model: 'gemini-3.5-flesh', provider: 'google' })

    expect(result.status).toBe('missing')
    expect(result.suggestions).toContain('gemini-3.5-flash')
  })

  it('un fallo de red deja el modelo sin verificar', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNRESET'))

    await expect(
      checkAiModelExists({ model: 'gemini-3.5-flash', provider: 'google' }),
    ).resolves.toMatchObject({ status: 'unverified' })
  })
})
