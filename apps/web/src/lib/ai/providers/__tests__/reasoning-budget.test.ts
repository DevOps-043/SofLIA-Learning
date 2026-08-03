import { describe, expect, it } from 'vitest'

import {
  applyReasoningHeadroom,
  consumesOutputBudgetReasoning,
  scaleTimeoutForReasoning,
} from '../reasoning-budget'

/**
 * Regresión del fallo que dejó sin calificar las actividades conversacionales al
 * reapuntar el propósito a OpenAI: el presupuesto calibrado para un modelo que
 * no razona se consumía razonando y la respuesta llegaba VACÍA.
 */
describe('consumesOutputBudgetReasoning', () => {
  it('detecta los modelos de razonamiento de OpenAI', () => {
    expect(consumesOutputBudgetReasoning({ model: 'gpt-5.1', provider: 'openai' })).toBe(true)
    expect(consumesOutputBudgetReasoning({ model: 'o3-mini', provider: 'openai' })).toBe(true)
    expect(consumesOutputBudgetReasoning({ model: 'gpt-4.1', provider: 'openai' })).toBe(false)
  })

  it('detecta las familias de Gemini que descuentan el razonamiento', () => {
    expect(consumesOutputBudgetReasoning({ model: 'gemini-3.5-flash', provider: 'google' })).toBe(true)
    expect(consumesOutputBudgetReasoning({ model: 'gemini-2.0-flash', provider: 'google' })).toBe(false)
  })

  it('un nivel explicito de off desactiva el razonamiento', () => {
    expect(
      consumesOutputBudgetReasoning({ model: 'gpt-5.1', provider: 'openai', thinkingLevel: 'off' }),
    ).toBe(false)
  })
})

describe('applyReasoningHeadroom', () => {
  it('reserva margen sobre el presupuesto visible en modelos que razonan', () => {
    const budget = applyReasoningHeadroom({
      maxOutputTokens: 4_096,
      model: 'gpt-5.1',
      provider: 'openai',
    })

    // Sin margen, el JSON de la rúbrica no llega a escribirse nunca.
    expect(budget).toBeGreaterThan(4_096)
  })

  it('no toca el presupuesto de un modelo que no razona', () => {
    expect(
      applyReasoningHeadroom({ maxOutputTokens: 4_096, model: 'gpt-4.1', provider: 'openai' }),
    ).toBe(4_096)
  })

  it('escala el margen con el nivel de razonamiento', () => {
    const low = applyReasoningHeadroom({
      maxOutputTokens: 1_000,
      model: 'gpt-5.1',
      provider: 'openai',
      thinkingLevel: 'low',
    })
    const high = applyReasoningHeadroom({
      maxOutputTokens: 1_000,
      model: 'gpt-5.1',
      provider: 'openai',
      thinkingLevel: 'high',
    })

    expect(high).toBeGreaterThan(low!)
  })

  it('nunca reduce el presupuesto configurado', () => {
    for (const thinkingLevel of ['off', 'low', 'medium', 'high', 'dynamic', 'default'] as const) {
      const budget = applyReasoningHeadroom({
        maxOutputTokens: 2_048,
        model: 'gpt-5.1',
        provider: 'openai',
        thinkingLevel,
      })

      expect(budget).toBeGreaterThanOrEqual(2_048)
    }
  })

  it('respeta "sin presupuesto fijado"', () => {
    expect(
      applyReasoningHeadroom({ maxOutputTokens: undefined, model: 'gpt-5.1', provider: 'openai' }),
    ).toBeUndefined()
  })

  it('no supera el limite de la plataforma', () => {
    const budget = applyReasoningHeadroom({
      maxOutputTokens: 65_000,
      model: 'gpt-5.1',
      provider: 'openai',
      thinkingLevel: 'high',
    })

    expect(budget).toBeLessThanOrEqual(65_536)
  })
})

/**
 * El tutor esperaba 8 s. Con esfuerzo alto el modelo los gasta razonando, la
 * llamada aborta y `generateDialogueTutorMessage` cae a su plantilla fija sin
 * registrar error: la actividad parece funcionar mientras responde siempre lo
 * mismo.
 */
describe('scaleTimeoutForReasoning', () => {
  it('amplia la espera cuando el modelo razona', () => {
    const timeout = scaleTimeoutForReasoning({
      baseTimeoutMs: 8_000,
      maxTimeoutMs: 30_000,
      model: 'gpt-5.1',
      provider: 'openai',
      thinkingLevel: 'high',
    })

    expect(timeout).toBeGreaterThan(8_000)
    expect(timeout).toBeLessThanOrEqual(30_000)
  })

  it('deja intacta la espera de un modelo que no razona', () => {
    expect(
      scaleTimeoutForReasoning({
        baseTimeoutMs: 8_000,
        maxTimeoutMs: 30_000,
        model: 'gpt-4.1',
        provider: 'openai',
      }),
    ).toBe(8_000)
  })

  it('nunca supera el techo del punto de llamada', () => {
    expect(
      scaleTimeoutForReasoning({
        baseTimeoutMs: 25_000,
        maxTimeoutMs: 60_000,
        model: 'gpt-5.1',
        provider: 'openai',
        thinkingLevel: 'high',
      }),
    ).toBe(60_000)
  })

  it('escala con el nivel de razonamiento', () => {
    const base = { baseTimeoutMs: 8_000, maxTimeoutMs: 90_000, model: 'gpt-5.1', provider: 'openai' as const }

    expect(scaleTimeoutForReasoning({ ...base, thinkingLevel: 'high' })).toBeGreaterThan(
      scaleTimeoutForReasoning({ ...base, thinkingLevel: 'low' }),
    )
  })
})
