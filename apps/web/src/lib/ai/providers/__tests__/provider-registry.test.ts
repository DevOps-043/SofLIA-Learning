import { describe, expect, it } from 'vitest'

import {
  inferAiProvider,
  resolveAiProvider,
  supportsOpenAiMinimalReasoning,
  supportsOpenAiReasoning,
  supportsOpenAiTemperature,
} from '../provider-registry'

describe('inferAiProvider', () => {
  it.each([
    'gemini-3.5-flash',
    'gemini-3.1-pro-preview',
    'GEMINI-3.5-FLASH',
    'gemma-3-27b-it',
    'learnlm-2.0-flash',
  ])('reconoce %s como Google', (model) => {
    expect(inferAiProvider(model)).toBe('google')
  })

  it.each([
    'gpt-5.1',
    'gpt-4.1-mini',
    'GPT-5',
    'chatgpt-4o-latest',
    'o1',
    'o3-mini',
    'o4-mini',
    'codex-mini-latest',
    'ft:gpt-4.1-mini:acme::AbC123',
  ])('reconoce %s como OpenAI', (model) => {
    expect(inferAiProvider(model)).toBe('openai')
  })

  it('devuelve null en lugar de adivinar cuando el modelo no se reconoce', () => {
    // Una errata NO debe resolverse a un proveedor por defecto: eso convertiría
    // el error de configuración en un fallo silencioso en producción.
    expect(inferAiProvider('gtp-5.1')).toBeNull()
    expect(inferAiProvider('llama-3-70b')).toBeNull()
    expect(inferAiProvider('   ')).toBeNull()
  })
})

describe('resolveAiProvider', () => {
  it('la selección explícita gana sobre el nombre del modelo', () => {
    expect(
      resolveAiProvider({ fallback: 'google', model: 'gemini-3.5-flash', selection: 'openai' }),
    ).toBe('openai')
  })

  it('deduce del modelo cuando la selección es automática', () => {
    expect(
      resolveAiProvider({ fallback: 'google', model: 'gpt-5.1', selection: 'auto' }),
    ).toBe('openai')
  })

  it('cae al fallback cuando ni la selección ni el modelo lo determinan', () => {
    expect(
      resolveAiProvider({ fallback: 'google', model: 'modelo-interno', selection: null }),
    ).toBe('google')
  })
})

describe('capacidades de los modelos de OpenAI', () => {
  it('identifica los modelos con razonamiento', () => {
    expect(supportsOpenAiReasoning('gpt-5.1')).toBe(true)
    expect(supportsOpenAiReasoning('o3-mini')).toBe(true)
    expect(supportsOpenAiReasoning('gpt-4.1-mini')).toBe(false)
  })

  it('los modelos de razonamiento no admiten temperature', () => {
    // La API responde 400 si se envía: es un rechazo, no una degradación.
    expect(supportsOpenAiTemperature('gpt-5.1')).toBe(false)
    expect(supportsOpenAiTemperature('gpt-4.1-mini')).toBe(true)
  })

  it('el esfuerzo "minimal" solo existe en GPT-5 y posteriores', () => {
    expect(supportsOpenAiMinimalReasoning('gpt-5.1')).toBe(true)
    expect(supportsOpenAiMinimalReasoning('o3-mini')).toBe(false)
  })
})
