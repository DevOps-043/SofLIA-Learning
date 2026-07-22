import { buildThinkingConfig } from './thinking'
import type { ResolvedAiModelSettings } from './types'

/**
 * Configuración de generación derivada de un propósito administrado.
 *
 * Se declara de forma estructural (no como `Record<string, unknown>`) para que
 * siga siendo asignable a los tipos `GenerationConfig` de ambos SDK de Gemini
 * sin casts en cada punto de llamada. `thinkingConfig` es un campo que la API
 * REST acepta pero que el SDK `@google/generative-ai` v0.24 todavía no tipa.
 */
export interface ManagedGenerationConfig {
  maxOutputTokens?: number
  responseMimeType?: string
  temperature?: number
  thinkingConfig?: { thinkingBudget: number }
}

/**
 * Traduce la configuración administrada de un propósito al objeto de generación
 * que espera el proveedor.
 *
 * Los campos con valor `null` en la configuración se OMITEN deliberadamente en
 * lugar de enviarse como `null`: significan "este propósito no gestiona ese
 * parámetro" y debe prevalecer el comportamiento del punto de llamada o del
 * proveedor.
 *
 * `overrides` permite fijar valores que no deben ser administrables, típicamente
 * `responseMimeType: 'application/json'` cuando la respuesta se parsea.
 */
export function buildManagedGenerationConfig(
  settings: ResolvedAiModelSettings,
  overrides: ManagedGenerationConfig = {},
): ManagedGenerationConfig {
  const config: ManagedGenerationConfig = {}

  if (settings.maxOutputTokens !== null) {
    config.maxOutputTokens = settings.maxOutputTokens
  }

  if (settings.temperature !== null) {
    config.temperature = settings.temperature
  }

  const thinkingConfig = buildThinkingConfig(settings.thinkingLevel)
  if (thinkingConfig) {
    config.thinkingConfig = thinkingConfig
  }

  return { ...config, ...overrides }
}
