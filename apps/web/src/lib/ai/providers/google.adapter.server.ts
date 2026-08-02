import 'server-only'

import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
  type Content,
  type GenerationConfig,
  type Part,
} from '@google/generative-ai'

import { buildThinkingConfig } from '../model-settings/thinking'
import {
  type AiContentPart,
  type AiGenerationRequest,
  type AiGenerationResult,
  type AiTextStream,
  type AiUsage,
} from './types'

/**
 * Adaptador de Google Gemini.
 *
 * Concentra todo lo específico del proveedor (categorías de seguridad, formato
 * de `Part`, `thinkingConfig`, extracción del texto visible) para que el gateway
 * y los puntos de llamada trabajen exclusivamente con el contrato neutral.
 */

export const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash'

const GEMINI_MODEL_ALIASES: Record<string, string> = {
  'gemini-3-flash-preview': DEFAULT_GEMINI_MODEL,
}

/**
 * Las generaciones anteriores a gemini-3 están retiradas o en desuso: se
 * redirigen al modelo vigente en lugar de fallar con "modelo no encontrado".
 */
const LEGACY_GEMINI_MODEL_PATTERN = /^gemini-(?:1\.5|2\.0|2\.5)(?:-|$)/

export function getGeminiApiKey(): string | null {
  return process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || null
}

export function resolveGeminiModel(
  explicitModel?: string | null,
  fallback = DEFAULT_GEMINI_MODEL,
): string {
  const configuredModel = (explicitModel || process.env.GEMINI_MODEL || fallback).trim()
  const normalizedModel = configuredModel.toLowerCase()
  if (LEGACY_GEMINI_MODEL_PATTERN.test(normalizedModel)) {
    return DEFAULT_GEMINI_MODEL
  }

  return GEMINI_MODEL_ALIASES[normalizedModel] || configuredModel
}

interface GeminiVisibleTextResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<Part & { thought?: boolean }>
    }
  }>
  text: () => string
}

/**
 * Concatena SOLO el texto visible, descartando las partes de razonamiento
 * interno (`thought: true`) que los modelos con "thinking" pueden incluir. El
 * SDK `@google/generative-ai` es anterior a ese campo y su `response.text()`
 * concatena TODAS las partes, lo que puede filtrar el chain-of-thought del
 * modelo al usuario.
 *
 * NO recorta espacios: en streaming, cada fragmento se concatena con el
 * siguiente y recortarlo pegaría las palabras del límite entre fragmentos.
 */
function collectVisibleGeminiText(response: GeminiVisibleTextResponse): string {
  const parts = response.candidates?.[0]?.content?.parts

  if (!parts || parts.length === 0) {
    return response.text()
  }

  return parts
    .filter((part) => typeof part.text === 'string' && part.thought !== true)
    .map((part) => part.text)
    .join('')
}

/**
 * Texto visible de una respuesta COMPLETA de Gemini, ya recortado. Usar siempre
 * en lugar de `response.text()`.
 */
export function extractVisibleGeminiText(response: GeminiVisibleTextResponse): string {
  return collectVisibleGeminiText(response).trim()
}

function normalizeUsage(
  usage?: {
    candidatesTokenCount?: number
    promptTokenCount?: number
    totalTokenCount?: number
  } | null,
): AiUsage | undefined {
  if (!usage) return undefined

  return {
    inputTokens: usage.promptTokenCount || 0,
    outputTokens: usage.candidatesTokenCount || 0,
    totalTokens: usage.totalTokenCount || 0,
  }
}

function toGeminiPart(part: AiContentPart): Part {
  if (part.type === 'text') {
    return { text: part.text }
  }

  return { inlineData: { data: part.data, mimeType: part.mimeType } }
}

function toGeminiParts(prompt: AiContentPart[] | string): Part[] {
  return typeof prompt === 'string' ? [{ text: prompt }] : prompt.map(toGeminiPart)
}

/**
 * `thinkingConfig` existe en la API REST de Gemini pero el SDK
 * `@google/generative-ai` (v0.24) es anterior a ese campo y no lo tipa. Se envía
 * por passthrough: los modelos que no lo soportan lo ignoran.
 */
type GeminiGenerationConfigWithThinking = Record<string, unknown> & {
  thinkingConfig?: { thinkingBudget: number }
}

/**
 * Se desactiva el filtrado de seguridad del proveedor porque la plataforma
 * aplica su propia moderación (`lib/ai-moderation`) y su detector de inyección
 * de prompts. Delegar además en los filtros de Google provocaba bloqueos falsos
 * sobre contenido formativo legítimo (seguridad industrial, salud laboral).
 */
const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
]

/**
 * Prepara modelo y configuración de generación. Lo comparten la vía normal y la
 * de streaming para que ambas apliquen exactamente los mismos ajustes.
 */
function prepareGoogleRequest(request: AiGenerationRequest) {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no esta configurada')
  }

  const model = resolveGeminiModel(request.model)
  const genAI = new GoogleGenerativeAI(apiKey)
  const geminiModel = genAI.getGenerativeModel({
    model,
    safetySettings: SAFETY_SETTINGS,
    ...(request.systemInstruction ? { systemInstruction: request.systemInstruction } : {}),
  })

  const config: GeminiGenerationConfigWithThinking = {
    topK: 40,
    topP: 0.95,
    ...(request.maxOutputTokens ? { maxOutputTokens: request.maxOutputTokens } : {}),
    ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
    ...(request.jsonSchema
      ? {
          responseJsonSchema: request.jsonSchema.schema,
          responseMimeType: 'application/json',
        }
      : {}),
    ...(!request.jsonSchema && request.responseAsJson
      ? { responseMimeType: 'application/json' }
      : {}),
  }

  const thinkingConfig = request.thinkingLevel
    ? buildThinkingConfig(request.thinkingLevel)
    : undefined
  if (thinkingConfig) {
    config.thinkingConfig = thinkingConfig
  }

  // El SDK no tipa `thinkingConfig` ni `responseJsonSchema` (ver
  // GeminiGenerationConfigWithThinking): se adapta al tipo del SDK en la
  // frontera, no en toda la función.
  const generationConfig = config as GenerationConfig
  const promptParts = toGeminiParts(request.prompt)
  const history = request.history?.map<Content>((turn) => ({
    // Gemini nombra `model` al rol que el contrato neutral llama `assistant`.
    parts: turn.parts.map(toGeminiPart),
    role: turn.role === 'assistant' ? 'model' : 'user',
  }))

  return { generationConfig, geminiModel, history, model, promptParts }
}

export async function generateGoogleText(
  request: AiGenerationRequest,
): Promise<AiGenerationResult> {
  const { generationConfig, geminiModel, history, model, promptParts } =
    prepareGoogleRequest(request)

  const result = history?.length
    ? await geminiModel.startChat({ generationConfig, history }).sendMessage(promptParts)
    : await geminiModel.generateContent({
        contents: [{ parts: promptParts, role: 'user' }],
        generationConfig,
      })

  return {
    model,
    provider: 'google',
    text: extractVisibleGeminiText(result.response),
    truncated: result.response.candidates?.[0]?.finishReason === 'MAX_TOKENS',
    usage: normalizeUsage(result.response.usageMetadata),
  }
}

export async function streamGoogleText(request: AiGenerationRequest): Promise<AiTextStream> {
  const { generationConfig, geminiModel, history, model, promptParts } =
    prepareGoogleRequest(request)

  const result = history?.length
    ? await geminiModel.startChat({ generationConfig, history }).sendMessageStream(promptParts)
    : await geminiModel.generateContentStream({
        contents: [{ parts: promptParts, role: 'user' }],
        generationConfig,
      })

  async function* readVisibleChunks(): AsyncGenerator<string> {
    for await (const chunk of result.stream) {
      // Misma barrera anti-fuga que en la vía no-streaming: `chunk.text()`
      // concatenaría también las partes de razonamiento interno.
      const piece = collectVisibleGeminiText(chunk)
      if (piece) yield piece
    }
  }

  return { model, provider: 'google', textChunks: readVisibleChunks() }
}
