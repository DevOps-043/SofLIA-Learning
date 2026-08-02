import type { AiThinkingLevel } from '../model-settings/thinking'
import { supportsOpenAiMinimalReasoning, supportsOpenAiReasoning } from './provider-registry'

/**
 * Traducción del nivel de razonamiento de la plataforma al parámetro
 * `reasoning.effort` de la API de Respuestas de OpenAI.
 *
 * El nivel es un concepto de la plataforma, no de un proveedor: el panel expone
 * una única escala (`off`/`low`/`medium`/`high`/`dynamic`) y cada adaptador la
 * traduce. En Gemini se convierte en un presupuesto de tokens (`thinkingBudget`)
 * y aquí en un esfuerzo cualitativo.
 *
 * Módulo puro: sin dependencias del SDK ni del entorno.
 */

export const OPENAI_REASONING_EFFORTS = ['minimal', 'low', 'medium', 'high'] as const

export type OpenAiReasoningEffort = (typeof OPENAI_REASONING_EFFORTS)[number]

/**
 * Devuelve el esfuerzo a enviar, o `undefined` para omitir el parámetro.
 *
 * Se omite en dos casos, ambos deliberados:
 * - `default`: no fijamos un esfuerzo implícito solo por tener el dato; manda el
 *   comportamiento por defecto del proveedor.
 * - `dynamic`: es el equivalente al presupuesto dinámico de Gemini (`-1`), que en
 *   OpenAI se expresa dejando que el modelo decida, es decir, no enviando nada.
 *
 * También se omite si el modelo no razona: enviarlo devolvería un 400.
 */
export function buildOpenAiReasoningEffort(
  level: AiThinkingLevel | undefined,
  model: string,
): OpenAiReasoningEffort | undefined {
  if (!level || level === 'default' || level === 'dynamic') return undefined
  if (!supportsOpenAiReasoning(model)) return undefined

  if (level === 'off') {
    // `minimal` solo existe en GPT-5+; en la serie `o` el mínimo real es `low`.
    return supportsOpenAiMinimalReasoning(model) ? 'minimal' : 'low'
  }

  return level
}
