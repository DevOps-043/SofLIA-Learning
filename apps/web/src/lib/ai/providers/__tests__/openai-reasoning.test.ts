import { describe, expect, it } from 'vitest'

import { buildOpenAiReasoningEffort } from '../openai-reasoning'

describe('buildOpenAiReasoningEffort', () => {
  it('omite el parámetro en el nivel "default" para que mande el proveedor', () => {
    expect(buildOpenAiReasoningEffort('default', 'gpt-5.1')).toBeUndefined()
  })

  it('omite el parámetro en "dynamic": equivale al presupuesto dinámico de Gemini', () => {
    expect(buildOpenAiReasoningEffort('dynamic', 'gpt-5.1')).toBeUndefined()
  })

  it('traduce los niveles intermedios uno a uno', () => {
    expect(buildOpenAiReasoningEffort('low', 'gpt-5.1')).toBe('low')
    expect(buildOpenAiReasoningEffort('medium', 'gpt-5.1')).toBe('medium')
    expect(buildOpenAiReasoningEffort('high', 'gpt-5.1')).toBe('high')
  })

  it('mapea "off" a minimal en GPT-5 y a low en la serie o', () => {
    // `minimal` no existe en la serie `o`: enviarlo devolvería un 400.
    expect(buildOpenAiReasoningEffort('off', 'gpt-5.1')).toBe('minimal')
    expect(buildOpenAiReasoningEffort('off', 'o3-mini')).toBe('low')
  })

  it('omite el parámetro en modelos sin razonamiento', () => {
    // La API rechaza `reasoning` en modelos que no razonan.
    expect(buildOpenAiReasoningEffort('high', 'gpt-4.1-mini')).toBeUndefined()
  })
})
