import 'server-only'

import type { Responses } from 'openai/resources/responses'

import { describeAiProviderError } from '../ai-error'
import { getOpenAiClient } from './openai-client.server'
import { buildOpenAiReasoningEffort } from './openai-reasoning'
import { supportsOpenAiTemperature } from './provider-registry'
import {
  UnsupportedAiRequestError,
  type AiContentPart,
  type AiGenerationRequest,
  type AiGenerationResult,
  type AiTextStream,
  type AiTurn,
  type AiUsage,
} from './types'

/**
 * Adaptador de OpenAI sobre la API de Respuestas (`/v1/responses`).
 *
 * POR QUÉ LA API DE RESPUESTAS Y NO CHAT COMPLETIONS: es la única que expone
 * `reasoning.effort`, imprescindible para que el nivel de razonamiento del panel
 * signifique lo mismo en ambos proveedores, y unifica modelos con y sin
 * razonamiento bajo un mismo contrato. Chat Completions quedaría sin equivalente
 * para esa configuración.
 *
 * PRIVACIDAD: `store: false` por defecto. La API retiene las respuestas 30 días
 * cuando `store` es verdadero, y por estas llamadas circula contenido de
 * empleados de organizaciones cliente (apuntes, respuestas de actividades,
 * analítica). Se puede reactivar con `OPENAI_STORE_RESPONSES=true` si una
 * organización lo requiere para depuración, pero nunca es el valor por defecto.
 */

/** Tipos de contenido binario que la API acepta y con qué forma. */
const IMAGE_MIME_PREFIX = 'image/'
const PDF_MIME_TYPE = 'application/pdf'

function shouldStoreResponses(): boolean {
  return process.env.OPENAI_STORE_RESPONSES?.trim().toLowerCase() === 'true'
}

/**
 * Traduce un fragmento neutral al formato de entrada de OpenAI.
 *
 * Los tipos no soportados (audio, vídeo) lanzan `UnsupportedAiRequestError` en
 * lugar de enviarse y fallar en el proveedor: así el mensaje explica que el
 * propósito requiere un proveedor con esa capacidad, en vez de un 400 opaco.
 */
function toOpenAiContentPart(part: AiContentPart): Responses.ResponseInputContent {
  if (part.type === 'text') {
    return { text: part.text, type: 'input_text' }
  }

  const dataUrl = `data:${part.mimeType};base64,${part.data}`

  if (part.mimeType.startsWith(IMAGE_MIME_PREFIX)) {
    return { detail: 'auto', image_url: dataUrl, type: 'input_image' }
  }

  if (part.mimeType === PDF_MIME_TYPE) {
    return { file_data: dataUrl, filename: 'document.pdf', type: 'input_file' }
  }

  throw new UnsupportedAiRequestError(
    'openai',
    `contenido binario de tipo "${part.mimeType}"`,
  )
}

/**
 * Un turno cuyo contenido es solo texto se envía como cadena. Es la forma que la
 * API documenta para mensajes simples y evita construir listas de fragmentos
 * innecesarias en la ruta más común (el historial de un chat).
 */
function toOpenAiMessage(role: AiTurn['role'], parts: AiContentPart[]): Responses.EasyInputMessage {
  const isTextOnly = parts.every((part) => part.type === 'text')
  if (isTextOnly) {
    return {
      content: parts.map((part) => (part.type === 'text' ? part.text : '')).join(''),
      role,
      type: 'message',
    }
  }

  return { content: parts.map(toOpenAiContentPart), role, type: 'message' }
}

function buildInput(request: AiGenerationRequest): Responses.ResponseInput {
  const history = (request.history ?? []).map((turn) => toOpenAiMessage(turn.role, turn.parts))
  const promptParts: AiContentPart[] =
    typeof request.prompt === 'string'
      ? [{ text: request.prompt, type: 'text' }]
      : request.prompt

  return [...history, toOpenAiMessage('user', promptParts)]
}

function buildTextConfig(request: AiGenerationRequest): Responses.ResponseTextConfig | undefined {
  if (request.jsonSchema) {
    return {
      format: {
        name: request.jsonSchema.name,
        schema: request.jsonSchema.schema,
        // `strict: false` porque los esquemas de la plataforma se escribieron
        // para Gemini y no cumplen todas las restricciones del modo estricto de
        // OpenAI (exige `additionalProperties: false` y `required` exhaustivo en
        // cada nivel). El resultado se valida igualmente con Zod en el punto de
        // llamada, que es la garantía real de forma.
        strict: false,
        type: 'json_schema',
      },
    }
  }

  if (request.responseAsJson) {
    return { format: { type: 'json_object' } }
  }

  return undefined
}

function normalizeUsage(usage: Responses.ResponseUsage | undefined): AiUsage | undefined {
  if (!usage) return undefined

  return {
    inputTokens: usage.input_tokens || 0,
    outputTokens: usage.output_tokens || 0,
    totalTokens: usage.total_tokens || 0,
  }
}

/**
 * Parámetros que la API rechaza según el modelo. Cuando devuelve un 400
 * señalando uno de ellos, el adaptador lo elimina y reintenta UNA vez.
 *
 * MOTIVO: la clasificación de modelos por nombre (`supportsOpenAiReasoning`) no
 * puede anticipar los modelos que OpenAI publique mañana. Sin este reintento, un
 * administrador que escriba un modelo nuevo obtendría un fallo permanente; con
 * él, la llamada se autocorrige y solo se paga un viaje extra la primera vez.
 */
const RETRYABLE_UNSUPPORTED_PARAMS = new Set(['temperature', 'reasoning', 'reasoning.effort'])

function extractUnsupportedParam(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null

  const status = (error as { status?: unknown }).status
  if (status !== 400) return null

  const param = (error as { param?: unknown }).param
  if (typeof param === 'string' && RETRYABLE_UNSUPPORTED_PARAMS.has(param)) {
    return param.split('.')[0]
  }

  // Algunas respuestas describen el parámetro solo en el mensaje.
  const message = describeAiProviderError(error).message.toLowerCase()
  if (!message.includes('unsupported') && !message.includes('not supported')) return null

  for (const candidate of ['temperature', 'reasoning']) {
    if (message.includes(candidate)) return candidate
  }

  return null
}

/**
 * `status: 'incomplete'` con `reason: 'max_output_tokens'` es el equivalente al
 * `finishReason: MAX_TOKENS` de Gemini: la respuesta viene vacía o truncada.
 */
function isTruncatedByBudget(response: Responses.Response): boolean {
  return (
    response.status === 'incomplete' &&
    response.incomplete_details?.reason === 'max_output_tokens'
  )
}

/** Parámetros comunes a la vía normal y a la de streaming. */
function buildRequestParams(
  request: AiGenerationRequest,
  model: string,
): Responses.ResponseCreateParamsNonStreaming {
  const reasoningEffort = buildOpenAiReasoningEffort(request.thinkingLevel, model)
  const canUseTemperature =
    request.temperature !== undefined && supportsOpenAiTemperature(model)

  const params: Responses.ResponseCreateParamsNonStreaming = {
    input: buildInput(request),
    model,
    store: shouldStoreResponses(),
    ...(request.systemInstruction ? { instructions: request.systemInstruction } : {}),
    ...(request.maxOutputTokens ? { max_output_tokens: request.maxOutputTokens } : {}),
    ...(canUseTemperature ? { temperature: request.temperature } : {}),
    ...(reasoningEffort ? { reasoning: { effort: reasoningEffort } } : {}),
  }

  const textConfig = buildTextConfig(request)
  if (textConfig) {
    params.text = textConfig
  }

  return params
}

/**
 * Ejecuta la petición y, si la API rechaza un parámetro por el modelo elegido,
 * la reintenta una vez sin él (ver `RETRYABLE_UNSUPPORTED_PARAMS`).
 */
async function createWithParamFallback<T>(
  params: Responses.ResponseCreateParamsNonStreaming,
  execute: (params: Responses.ResponseCreateParamsNonStreaming) => Promise<T>,
): Promise<T> {
  try {
    return await execute(params)
  } catch (error) {
    const unsupportedParam = extractUnsupportedParam(error)
    if (!unsupportedParam) throw error

    const retryParams = { ...params }
    delete retryParams[unsupportedParam as 'reasoning' | 'temperature']
    return execute(retryParams)
  }
}

export async function generateOpenAiText(
  request: AiGenerationRequest,
): Promise<AiGenerationResult> {
  const client = getOpenAiClient()
  const model = request.model.trim()
  const params = buildRequestParams(request, model)
  const requestOptions = request.timeoutMs ? { timeout: request.timeoutMs } : undefined

  const response = await createWithParamFallback(params, (finalParams) =>
    client.responses.create(finalParams, requestOptions),
  )

  return {
    model: response.model || model,
    provider: 'openai',
    text: response.output_text.trim(),
    truncated: isTruncatedByBudget(response),
    usage: normalizeUsage(response.usage),
  }
}

export async function streamOpenAiText(
  request: AiGenerationRequest,
): Promise<AiTextStream> {
  const client = getOpenAiClient()
  const model = request.model.trim()
  const params = buildRequestParams(request, model)
  const requestOptions = request.timeoutMs ? { timeout: request.timeoutMs } : undefined

  const stream = await createWithParamFallback(params, (finalParams) =>
    client.responses.create({ ...finalParams, stream: true }, requestOptions),
  )

  async function* readVisibleChunks(): AsyncGenerator<string> {
    for await (const event of stream) {
      // Solo los deltas de texto de salida. Los eventos de razonamiento
      // (`response.reasoning_*`) se descartan a propósito: son el equivalente a
      // las partes `thought` de Gemini y nunca deben llegar al usuario.
      if (event.type === 'response.output_text.delta' && event.delta) {
        yield event.delta
      }
    }
  }

  return { model, provider: 'openai', textChunks: readVisibleChunks() }
}
