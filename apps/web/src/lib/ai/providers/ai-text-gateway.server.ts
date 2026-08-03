import 'server-only'

import {
  CIRCUIT_BREAKER_DEFAULTS,
  executeWithCircuitBreaker,
} from '@/lib/resilience/circuit-breaker'
import { logger } from '@/lib/utils/logger'

import { describeAiProviderError } from '../ai-error'
import { getAiModelSettings } from '../model-settings/ai-model-settings.server.service'
import {
  PLATFORM_DEFAULT_AI_PROVIDER,
  type AiModelPurposeId,
} from '../model-settings/purposes'
import type { AiThinkingLevel } from '../model-settings/thinking'
import { buildPromptModelProfile } from '../prompts/prompt-variants'
import type { PromptModelProfile } from '../prompts/types'
import {
  generateGoogleText,
  getGeminiApiKey,
  streamGoogleText,
} from './google.adapter.server'
import {
  getOpenAiApiKey,
  getOpenAiCredentialIssue,
} from './openai-client.server'
import { generateOpenAiText, streamOpenAiText } from './openai.adapter.server'
import { inferAiProvider, type AiProvider } from './provider-registry'
import {
  UnsupportedAiRequestError,
  type AiContentPart,
  type AiGenerationRequest,
  type AiGenerationResult,
  type AiJsonSchema,
  type AiStreamAdapter,
  type AiTextAdapter,
  type AiTextStream,
  type AiTurn,
} from './types'

/**
 * Punto de entrada ÚNICO de generación de texto con IA de la plataforma.
 *
 * RESPONSABILIDADES:
 * 1. Resolver la configuración administrada del propósito (modelo, proveedor,
 *    tokens, temperatura y nivel de razonamiento) desde el panel de superadmin.
 * 2. Despachar al adaptador del proveedor correspondiente.
 * 3. Envolver la llamada en el circuit breaker y registrar el fallo con
 *    metadatos suficientes para diagnosticarlo.
 *
 * REGLA: ningún punto de llamada debe instanciar un SDK de proveedor por su
 * cuenta. Hacerlo rompe la promesa del panel —cambiar el modelo a `gpt-5.1` no
 * tendría efecto en esa ruta— y deja la configuración mintiendo, que es peor que
 * no tenerla.
 */

const ADAPTERS: Record<AiProvider, AiTextAdapter> = {
  google: generateGoogleText,
  openai: generateOpenAiText,
}

const STREAM_ADAPTERS: Record<AiProvider, AiStreamAdapter> = {
  google: streamGoogleText,
  openai: streamOpenAiText,
}

const CREDENTIAL_READERS: Record<AiProvider, () => string | null> = {
  google: getGeminiApiKey,
  openai: getOpenAiApiKey,
}

/**
 * Diagnostico seguro de credenciales: solo devuelve nombres/codigos, nunca el
 * valor del secreto. Detecta tambien el typo `OPENAI_APY_KEY` observado en
 * configuraciones reales; no se acepta como alias para evitar perpetuarlo.
 */
export function describeAiProviderCredentialIssue(provider: AiProvider): string | null {
  if (provider === 'openai') return getOpenAiCredentialIssue()
  if (CREDENTIAL_READERS[provider]()) return null

  return `AI_API_KEY_MISSING:${provider}`
}

/** `true` cuando el proveedor tiene credenciales configuradas en el entorno. */
export function hasAiProviderCredentials(provider: AiProvider): boolean {
  return describeAiProviderCredentialIssue(provider) === null
}

/**
 * `true` cuando el propósito puede ejecutarse: existe configuración y el
 * proveedor al que apunta tiene credenciales.
 *
 * Sustituye a las comprobaciones directas de `GEMINI_API_KEY` repartidas por el
 * código, que con dos proveedores darían un falso negativo (propósito servido
 * por OpenAI con la clave de Google ausente) o un falso positivo (al revés). Los
 * puntos de llamada la usan para decidir si degradan a su respuesta de respaldo.
 */
export async function isAiPurposeAvailable(purposeId: AiModelPurposeId): Promise<boolean> {
  const settings = await getAiModelSettings(purposeId)
  return hasAiProviderCredentials(settings.provider)
}

/**
 * Contenido de un turno: literal, o una función que recibe el perfil del modelo
 * destino y devuelve la variante de prompt escrita para ese proveedor.
 */
export type AiPromptInput =
  | AiContentPart[]
  | string
  | ((profile: PromptModelProfile) => AiContentPart[] | string)

export type AiSystemInstructionInput = string | ((profile: PromptModelProfile) => string)

export interface GenerateAiTextParams {
  /** Nombre del breaker que aísla este punto de llamada de los demás. */
  circuitBreakerName: string
  history?: AiTurn[]
  /**
   * Fuerza salida ceñida a un esquema JSON. Es responsabilidad del punto de
   * llamada validar el resultado (Zod): el esquema guía al modelo, no garantiza
   * la forma.
   */
  jsonSchema?: AiJsonSchema
  /**
   * Presupuesto de tokens de salida. Tiene precedencia sobre el configurado en
   * el panel; reservado para propósitos cuyo presupuesto se deriva del contenido
   * (longitud del texto a traducir, número de frases de una rúbrica).
   */
  maxOutputTokens?: number
  /**
   * Modelo explícito. Salta la configuración del panel: usar solo cuando el
   * modelo NO deba ser administrable (sondas de estado, pruebas).
   */
  model?: string
  /**
   * Contenido del turno actual.
   *
   * Puede ser una función que recibe el perfil del modelo ya resuelto, para que
   * el punto de llamada elija la variante de prompt escrita para ese proveedor.
   */
  prompt: AiPromptInput
  /** Proveedor explícito. Solo tiene sentido junto con `model`. */
  provider?: AiProvider
  /**
   * Propósito del que heredar modelo, proveedor, tokens, temperatura y nivel de
   * razonamiento configurados desde el panel de superadmin.
   */
  purpose?: AiModelPurposeId
  /** Fuerza salida JSON sin esquema. */
  responseAsJson?: boolean
  /**
   * Instrucción de sistema. Igual que `prompt`, admite una función del perfil
   * del modelo para elegir la variante escrita para el proveedor destino.
   */
  systemInstruction?: AiSystemInstructionInput
  /** Temperatura explícita; tiene precedencia sobre la del panel. */
  temperature?: number
  /** Nivel de razonamiento explícito; tiene precedencia sobre el del panel. */
  thinkingLevel?: AiThinkingLevel
  timeoutMs?: number
}

/**
 * El breaker por defecto está calibrado para Gemini. OpenAI se aísla en su
 * propio conjunto de umbrales para que una caída de un proveedor no abra el
 * circuito del otro ni herede su tolerancia a latencia.
 */
function resolveCircuitBreakerOptions(provider: AiProvider, timeoutMs: number | undefined) {
  const defaults =
    provider === 'openai' ? CIRCUIT_BREAKER_DEFAULTS.openai : CIRCUIT_BREAKER_DEFAULTS.gemini

  return { ...defaults, ...(timeoutMs ? { timeoutMs } : {}) }
}

/**
 * El nombre del breaker incorpora el proveedor para que el histórico de fallos
 * no se mezcle al cambiar de modelo desde el panel: si `lia_general` pasa de
 * Gemini a OpenAI, los fallos acumulados de Gemini no deben abrir el circuito
 * recién estrenado de OpenAI.
 */
function buildCircuitBreakerName(baseName: string, provider: AiProvider): string {
  return `${baseName}:${provider}`
}

/**
 * Traduce los parámetros del punto de llamada a la petición neutral, resolviendo
 * antes la configuración administrada del propósito.
 */
async function buildRequest(params: GenerateAiTextParams): Promise<AiGenerationRequest> {
  const settings = params.purpose ? await getAiModelSettings(params.purpose) : null

  const model = params.model ?? settings?.model
  if (!model) {
    throw new Error('AI_MODEL_NOT_RESOLVED: se requiere `purpose` o `model`.')
  }

  // Cuando el punto de llamada fija un modelo explícito, el proveedor se deduce
  // de ESE modelo y no del propósito: un autor de curso que declare `gpt-5.1` en
  // su actividad espera que se llame a OpenAI aunque el propósito apunte a
  // Gemini. Si el nombre no se reconoce, manda el proveedor del propósito.
  const provider: AiProvider =
    params.provider ??
    (params.model ? inferAiProvider(params.model) : null) ??
    settings?.provider ??
    PLATFORM_DEFAULT_AI_PROVIDER

  const managed = resolveManagedParameters(params, settings)

  // El perfil se construye una sola vez con el proveedor, el modelo y el nivel
  // de razonamiento YA resueltos: es la única forma de que el punto de llamada
  // elija variante sin duplicar esa resolución.
  const promptProfile = buildPromptModelProfile({
    model,
    provider,
    thinkingLevel: managed.thinkingLevel,
  })

  return {
    circuitBreakerName: params.circuitBreakerName,
    model,
    prompt: typeof params.prompt === 'function' ? params.prompt(promptProfile) : params.prompt,
    provider,
    ...(params.history ? { history: params.history } : {}),
    ...(params.jsonSchema ? { jsonSchema: params.jsonSchema } : {}),
    ...(params.responseAsJson ? { responseAsJson: params.responseAsJson } : {}),
    ...(params.systemInstruction
      ? {
          systemInstruction:
            typeof params.systemInstruction === 'function'
              ? params.systemInstruction(promptProfile)
              : params.systemInstruction,
        }
      : {}),
    ...(params.timeoutMs ? { timeoutMs: params.timeoutMs } : {}),
    ...managed,
  }
}

/**
 * Ejecuta una llamada al proveedor con circuit breaker y observabilidad.
 *
 * Es el punto ÚNICO donde se registra un fallo de proveedor: sin él, un 4xx
 * llega al punto de llamada como un mensaje opaco y no se puede distinguir la
 * causa (petición inválida, cuota, modelo inexistente). Solo metadatos: nunca el
 * prompt ni contenido del usuario.
 */
async function executeWithObservability<T>(
  request: AiGenerationRequest,
  purpose: AiModelPurposeId | undefined,
  execute: (request: AiGenerationRequest) => Promise<T>,
): Promise<T> {
  const breakerName = buildCircuitBreakerName(request.circuitBreakerName, request.provider)

  try {
    return await executeWithCircuitBreaker(
      breakerName,
      () => execute(request),
      resolveCircuitBreakerOptions(request.provider, request.timeoutMs),
    )
  } catch (error) {
    const details = describeAiProviderError(error)
    logger.warn('AI request failed', {
      apiStatus: details.apiStatus,
      circuitBreakerName: breakerName,
      error: details.message,
      httpStatus: details.httpStatus,
      maxOutputTokens: request.maxOutputTokens ?? null,
      model: request.model,
      provider: request.provider,
      purpose: purpose ?? null,
      reason: details.reason,
      thinkingLevel: request.thinkingLevel ?? null,
    })
    throw error
  }
}

export async function generateAiText(
  params: GenerateAiTextParams,
): Promise<AiGenerationResult> {
  const request = await buildRequest(params)

  return executeWithObservability(request, params.purpose, (finalRequest) =>
    ADAPTERS[finalRequest.provider](finalRequest),
  )
}

/**
 * Variante en streaming. Devuelve una secuencia de fragmentos de texto visible.
 *
 * IMPORTANTE: el circuit breaker cubre la APERTURA del stream, no su consumo.
 * Un corte a mitad de la respuesta no cuenta como fallo del proveedor porque
 * llega al punto de llamada, que ya tiene texto parcial que mostrar y decide
 * cómo cerrar.
 */
export async function streamAiText(params: GenerateAiTextParams): Promise<AiTextStream> {
  const request = await buildRequest(params)

  return executeWithObservability(request, params.purpose, (finalRequest) =>
    STREAM_ADAPTERS[finalRequest.provider](finalRequest),
  )
}

/**
 * Combina los parámetros administrados con los explícitos del punto de llamada.
 *
 * Los campos con valor `null` en la configuración se OMITEN deliberadamente: en
 * ese propósito significan "no lo gestiona el panel" y debe prevalecer el
 * comportamiento del proveedor. Un `undefined` en `params` significa lo mismo,
 * de ahí la comprobación explícita en lugar de `??`.
 */
function resolveManagedParameters(
  params: GenerateAiTextParams,
  settings: { maxOutputTokens: number | null; temperature: number | null; thinkingLevel: AiThinkingLevel } | null,
): Pick<AiGenerationRequest, 'maxOutputTokens' | 'temperature' | 'thinkingLevel'> {
  const maxOutputTokens = params.maxOutputTokens ?? settings?.maxOutputTokens ?? null
  const temperature = params.temperature ?? settings?.temperature ?? null
  const thinkingLevel = params.thinkingLevel ?? settings?.thinkingLevel

  return {
    ...(maxOutputTokens !== null ? { maxOutputTokens } : {}),
    ...(temperature !== null ? { temperature } : {}),
    ...(thinkingLevel && thinkingLevel !== 'default' ? { thinkingLevel } : {}),
  }
}

export { UnsupportedAiRequestError }
export type {
  AiContentPart,
  AiGenerationResult,
  AiJsonSchema,
  AiTextStream,
  AiTurn,
} from './types'
