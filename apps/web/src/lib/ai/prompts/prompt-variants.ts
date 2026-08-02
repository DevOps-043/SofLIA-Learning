import type { AiThinkingLevel } from '../model-settings/thinking'
import { supportsOpenAiReasoning, type AiProvider } from '../providers/provider-registry'

import type { PromptModelProfile, PromptVariants } from './types'

/**
 * Perfil del modelo destino y selección de la variante de prompt.
 *
 * Módulo puro: sin dependencias del servidor, seguro de usar desde cualquier capa.
 */

/**
 * Familias de Gemini con razonamiento interno. En ellas, el presupuesto de
 * razonamiento se descuenta de `maxOutputTokens`, igual que en OpenAI.
 */
const GEMINI_REASONING_MODEL_PATTERN = /^gemini-[3-9]/

function reasonsInternally(params: {
  model: string
  provider: AiProvider
  thinkingLevel: AiThinkingLevel
}): boolean {
  // Un nivel explícito de `off` desactiva la deliberación aunque el modelo la
  // soporte: en ese caso el prompt SÍ debe pedir razonamiento por texto.
  if (params.thinkingLevel === 'off') return false

  const normalizedModel = params.model.trim().toLowerCase()

  return params.provider === 'openai'
    ? supportsOpenAiReasoning(normalizedModel)
    : GEMINI_REASONING_MODEL_PATTERN.test(normalizedModel)
}

export function buildPromptModelProfile(params: {
  model: string
  provider: AiProvider
  thinkingLevel?: AiThinkingLevel
}): PromptModelProfile {
  const thinkingLevel = params.thinkingLevel ?? 'default'

  return {
    model: params.model,
    provider: params.provider,
    reasonsInternally: reasonsInternally({ ...params, thinkingLevel }),
    thinkingLevel,
  }
}

/**
 * Elige la variante escrita para el proveedor destino.
 *
 * La variante de Google NO recibe el perfil a propósito: es el prompt original,
 * literal y congelado, y no debe empezar a ramificar por modelo. La de OpenAI sí
 * lo recibe, porque dentro de OpenAI hay dos comportamientos muy distintos según
 * el modelo razone internamente o no.
 */
export function selectPromptVariant<TArgs extends readonly unknown[]>(
  profile: PromptModelProfile,
  variants: PromptVariants<TArgs>,
  ...args: TArgs
): string {
  return profile.provider === 'openai'
    ? variants.openai(profile, ...args)
    : variants.google(...args)
}
