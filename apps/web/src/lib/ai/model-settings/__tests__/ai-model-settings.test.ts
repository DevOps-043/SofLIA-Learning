import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { buildManagedGenerationConfig } from '../generation-config'
import { AI_MODEL_PURPOSES, getAiModelPurpose, isAiModelPurposeId } from '../purposes'
import { buildThinkingConfig } from '../thinking'
import type { ResolvedAiModelSettings } from '../types'
import {
  aiModelSettingsUpdateSchema,
  assertUpdateMatchesCapabilities,
  UnsupportedAiCapabilityError,
} from '../validation'

/**
 * La resolución de configuración se prueba a través del cliente de Supabase
 * simulado: es la única dependencia externa del servicio y permite verificar la
 * cadena de precedencia completa (base de datos → entorno → default de código)
 * sin tocar la red ni la base real.
 */
const selectMock = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({ select: selectMock }),
  }),
}))

vi.mock('@/lib/utils/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}))

async function loadService() {
  vi.resetModules()
  return import('../ai-model-settings.server.service')
}

describe('catálogo de propósitos', () => {
  it('no tiene identificadores duplicados', () => {
    const ids = AI_MODEL_PURPOSES.map((purpose) => purpose.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('separa SofLIA general del SofLIA de actividades de curso', () => {
    expect(isAiModelPurposeId('lia_general')).toBe(true)
    expect(isAiModelPurposeId('soflia_dialogue_tutor')).toBe(true)
    expect(getAiModelPurpose('lia_general').group).toBe('soflia')
    expect(getAiModelPurpose('soflia_dialogue_tutor').group).toBe('courses')
  })

  it('rechaza propósitos desconocidos', () => {
    expect(isAiModelPurposeId('no_existe')).toBe(false)
  })
})

describe('getAiModelSettings — precedencia', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    selectMock.mockReset()
    delete process.env.GEMINI_MODEL
    delete process.env.LIA_CHAT_GEMINI_MODEL
    delete process.env.GEMINI_MAX_TOKENS
    delete process.env.GEMINI_TEMPERATURE
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('usa el default de código cuando no hay override ni entorno', async () => {
    selectMock.mockResolvedValue({ data: [], error: null })
    const { getAiModelSettings } = await loadService()

    const settings = await getAiModelSettings('lia_general')

    expect(settings.model).toBe('gemini-3.5-flash')
    expect(settings.modelSource).toBe('default')
    expect(settings.hasDatabaseOverride).toBe(false)
    expect(settings.maxOutputTokens).toBe(8192)
    expect(settings.temperature).toBe(0.7)
  })

  it('prefiere la variable de entorno legacy sobre el default', async () => {
    process.env.LIA_CHAT_GEMINI_MODEL = 'gemini-desde-entorno'
    process.env.GEMINI_MAX_TOKENS = '4096'
    selectMock.mockResolvedValue({ data: [], error: null })
    const { getAiModelSettings } = await loadService()

    const settings = await getAiModelSettings('lia_general')

    expect(settings.model).toBe('gemini-desde-entorno')
    expect(settings.modelSource).toBe('environment')
    expect(settings.maxOutputTokens).toBe(4096)
  })

  it('prefiere el override de base de datos sobre el entorno', async () => {
    process.env.LIA_CHAT_GEMINI_MODEL = 'gemini-desde-entorno'
    selectMock.mockResolvedValue({
      data: [
        {
          max_output_tokens: 2048,
          model: 'gemini-desde-bd',
          purpose: 'lia_general',
          temperature: 0.1,
          thinking_level: 'high',
          updated_at: '2026-07-22T00:00:00.000Z',
        },
      ],
      error: null,
    })
    const { getAiModelSettings } = await loadService()

    const settings = await getAiModelSettings('lia_general')

    expect(settings.model).toBe('gemini-desde-bd')
    expect(settings.modelSource).toBe('database')
    expect(settings.hasDatabaseOverride).toBe(true)
    expect(settings.maxOutputTokens).toBe(2048)
    expect(settings.temperature).toBe(0.1)
    expect(settings.thinkingLevel).toBe('high')
  })

  it('resuelve cada propósito de forma independiente', async () => {
    selectMock.mockResolvedValue({
      data: [
        {
          max_output_tokens: null,
          model: 'modelo-de-actividades',
          purpose: 'soflia_dialogue_tutor',
          temperature: null,
          thinking_level: 'default',
          updated_at: '2026-07-22T00:00:00.000Z',
        },
      ],
      error: null,
    })
    const { getAiModelSettings } = await loadService()

    expect((await getAiModelSettings('soflia_dialogue_tutor')).model).toBe(
      'modelo-de-actividades',
    )
    expect((await getAiModelSettings('lia_general')).model).toBe('gemini-3.5-flash')
  })

  it('degrada a entorno/defaults si la base de datos falla', async () => {
    selectMock.mockResolvedValue({ data: null, error: { message: 'boom' } })
    const { getAiModelSettings } = await loadService()

    const settings = await getAiModelSettings('lia_general')

    expect(settings.model).toBe('gemini-3.5-flash')
    expect(settings.hasDatabaseOverride).toBe(false)
  })

  it('lee la tabla una sola vez para múltiples propósitos (caché)', async () => {
    selectMock.mockResolvedValue({ data: [], error: null })
    const { getAiModelSettings } = await loadService()

    await getAiModelSettings('lia_general')
    await getAiModelSettings('soflia_dialogue_tutor')
    await getAiModelSettings('ai_moderation')

    expect(selectMock).toHaveBeenCalledTimes(1)
  })
})

describe('buildThinkingConfig', () => {
  it('omite thinkingConfig en el nivel por defecto', () => {
    expect(buildThinkingConfig('default')).toBeUndefined()
  })

  it('traduce los niveles a presupuesto de tokens', () => {
    expect(buildThinkingConfig('off')).toEqual({ thinkingBudget: 0 })
    expect(buildThinkingConfig('dynamic')).toEqual({ thinkingBudget: -1 })
    expect(buildThinkingConfig('high')?.thinkingBudget).toBeGreaterThan(
      buildThinkingConfig('low')?.thinkingBudget ?? 0,
    )
  })
})

describe('buildManagedGenerationConfig', () => {
  const baseSettings: ResolvedAiModelSettings = {
    hasDatabaseOverride: false,
    maxOutputTokens: 1000,
    model: 'gemini-3.5-flash',
    modelSource: 'default',
    purpose: 'lia_general',
    temperature: 0.5,
    thinkingLevel: 'default',
    updatedAt: null,
  }

  it('omite los parámetros nulos en lugar de enviarlos', () => {
    const config = buildManagedGenerationConfig({
      ...baseSettings,
      maxOutputTokens: null,
      temperature: null,
    })

    expect(config).not.toHaveProperty('maxOutputTokens')
    expect(config).not.toHaveProperty('temperature')
  })

  it('deja que los overrides del punto de llamada ganen', () => {
    const config = buildManagedGenerationConfig(baseSettings, {
      responseMimeType: 'application/json',
      temperature: 0.9,
    })

    expect(config.temperature).toBe(0.9)
    expect(config.maxOutputTokens).toBe(1000)
    expect(config.responseMimeType).toBe('application/json')
  })
})

describe('validación de la actualización', () => {
  it('rechaza identificadores de modelo con caracteres no permitidos', () => {
    const result = aiModelSettingsUpdateSchema.safeParse({ model: 'modelo/../malo' })
    expect(result.success).toBe(false)
  })

  it('rechaza temperaturas fuera de rango', () => {
    expect(aiModelSettingsUpdateSchema.safeParse({ temperature: 5 }).success).toBe(false)
  })

  it('acepta null para volver al valor heredado', () => {
    const result = aiModelSettingsUpdateSchema.safeParse({ maxOutputTokens: null })
    expect(result.success).toBe(true)
  })

  it('acepta presupuestos pequeños de clasificadores (regresión: min era 256)', () => {
    // language_detection usa 10, lia_intent usa 200: ambos < 256. Un mínimo
    // global de 256 los rechazaba con 400 "Configuración inválida" al guardar.
    expect(aiModelSettingsUpdateSchema.safeParse({ maxOutputTokens: 10 }).success).toBe(true)
    expect(aiModelSettingsUpdateSchema.safeParse({ maxOutputTokens: 200 }).success).toBe(true)
  })

  it('sigue rechazando maxOutputTokens no positivo o fuera del máximo', () => {
    expect(aiModelSettingsUpdateSchema.safeParse({ maxOutputTokens: 0 }).success).toBe(false)
    expect(aiModelSettingsUpdateSchema.safeParse({ maxOutputTokens: 70_000 }).success).toBe(false)
  })

  it('rechaza un cuerpo vacío', () => {
    expect(aiModelSettingsUpdateSchema.safeParse({}).success).toBe(false)
  })

  it('rechaza parámetros que el propósito no admite', () => {
    expect(() =>
      assertUpdateMatchesCapabilities('auto_translation', { maxOutputTokens: 2000 }),
    ).toThrow(UnsupportedAiCapabilityError)
  })
})
