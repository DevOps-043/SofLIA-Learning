import 'server-only'

import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
  type GenerationConfig,
  type Part,
} from '@google/generative-ai'

import { describeGeminiError } from '@/lib/ai/gemini-error'
import { logger } from '@/lib/utils/logger'
import { getAiModelSettings } from '@/lib/ai/model-settings/ai-model-settings.server.service'
import type { AiModelPurposeId } from '@/lib/ai/model-settings/purposes'
import { buildThinkingConfig, type AiThinkingLevel } from '@/lib/ai/model-settings/thinking'
import {
  CIRCUIT_BREAKER_DEFAULTS,
  executeWithCircuitBreaker,
} from '@/lib/resilience/circuit-breaker'

export interface GeminiUsageMetadata {
  promptTokenCount: number
  candidatesTokenCount: number
  totalTokenCount: number
}

export interface GeminiTextResult {
  text: string
  model: string
  usage?: GeminiUsageMetadata
}

interface GenerateGeminiTextParams {
  circuitBreakerName: string
  /**
   * Ajustes explícitos. Tienen precedencia sobre lo resuelto por `purpose`, de
   * modo que un punto de llamada pueda fijar un valor que no debe ser
   * administrable (p. ej. `responseMimeType`).
   */
  generationConfig?: {
    maxOutputTokens?: number
    responseMimeType?: string
    temperature?: number
    topK?: number
    topP?: number
  }
  history?: Array<{ role: 'user' | 'model'; parts: Part[] }>
  model?: string
  prompt: string | Part[]
  /**
   * Propósito de IA del que heredar modelo, presupuesto de tokens, temperatura y
   * nivel de razonamiento configurados desde el panel de superadmin.
   * Omitirlo mantiene el comportamiento histórico (entorno + defaults del cliente).
   */
  purpose?: AiModelPurposeId
  systemInstruction?: string
  thinkingLevel?: AiThinkingLevel
  timeoutMs?: number
}

/**
 * `thinkingConfig` existe en la API REST de Gemini pero el SDK
 * `@google/generative-ai` (v0.24) es anterior a ese campo y no lo tipa. Se envía
 * por passthrough: los modelos que no lo soportan lo ignoran.
 */
type GeminiGenerationConfigWithThinking = Record<string, unknown> & {
  thinkingConfig?: { thinkingBudget: number }
}

export function getGeminiApiKey(): string | null {
  return process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || null
}

export const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash'

const GEMINI_MODEL_ALIASES: Record<string, string> = {
  'gemini-3-flash-preview': DEFAULT_GEMINI_MODEL,
}

const LEGACY_GEMINI_MODEL_PATTERN = /^gemini-(?:1\.5|2\.0|2\.5)(?:-|$)/

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
  text: () => string
  candidates?: Array<{
    content?: {
      parts?: Array<Part & { thought?: boolean }>
    }
  }>
}

/**
 * Extrae SOLO el texto visible de una respuesta de Gemini, descartando las
 * partes de razonamiento interno (`thought: true`) que los modelos con
 * "thinking" pueden incluir. El SDK `@google/generative-ai` es anterior a ese
 * campo y su `response.text()` concatena TODAS las partes, lo que puede filtrar
 * el chain-of-thought del modelo al usuario. Usar siempre este helper en lugar
 * de `response.text()`.
 */
export function extractVisibleGeminiText(response: GeminiVisibleTextResponse): string {
  const parts = response.candidates?.[0]?.content?.parts

  if (!parts || parts.length === 0) {
    return response.text().trim()
  }

  return parts
    .filter((part) => typeof part.text === 'string' && part.thought !== true)
    .map((part) => part.text)
    .join('')
    .trim()
}

export function normalizeGeminiUsage(
  usage?: {
    promptTokenCount?: number
    candidatesTokenCount?: number
    totalTokenCount?: number
  } | null,
): GeminiUsageMetadata | undefined {
  if (!usage) {
    return undefined
  }

  return {
    promptTokenCount: usage.promptTokenCount || 0,
    candidatesTokenCount: usage.candidatesTokenCount || 0,
    totalTokenCount: usage.totalTokenCount || 0,
  }
}

export async function generateGeminiText({
  circuitBreakerName,
  generationConfig,
  history,
  model,
  prompt,
  purpose,
  systemInstruction,
  thinkingLevel,
  timeoutMs,
}: GenerateGeminiTextParams): Promise<GeminiTextResult> {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no esta configurada')
  }

  const settings = purpose ? await getAiModelSettings(purpose) : null
  const modelName = resolveGeminiModel(model ?? settings?.model)
  const genAI = new GoogleGenerativeAI(apiKey)
  const geminiModel = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction,
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ],
  })

  // Precedencia: ajustes explícitos del punto de llamada → configuración
  // administrada del propósito → defaults del cliente.
  const config: GeminiGenerationConfigWithThinking = {
    maxOutputTokens: 8192,
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    ...(settings?.maxOutputTokens !== null && settings?.maxOutputTokens !== undefined
      ? { maxOutputTokens: settings.maxOutputTokens }
      : {}),
    ...(settings?.temperature !== null && settings?.temperature !== undefined
      ? { temperature: settings.temperature }
      : {}),
    ...generationConfig,
  }

  const effectiveThinkingLevel = thinkingLevel ?? settings?.thinkingLevel
  const thinkingConfig = effectiveThinkingLevel
    ? buildThinkingConfig(effectiveThinkingLevel)
    : undefined
  if (thinkingConfig) {
    config.thinkingConfig = thinkingConfig
  }

  // El SDK no tipa `thinkingConfig` (ver GeminiGenerationConfigWithThinking):
  // se adapta al tipo del SDK en la frontera, no en toda la función.
  const sdkGenerationConfig = config as GenerationConfig

  let result: Awaited<ReturnType<typeof geminiModel.generateContent>>
  try {
    result = await executeWithCircuitBreaker(
      circuitBreakerName,
      () => {
        if (history) {
          return geminiModel.startChat({
            generationConfig: sdkGenerationConfig,
            history,
          }).sendMessage(prompt)
        }

        return geminiModel.generateContent({
          contents: [{ role: 'user', parts: typeof prompt === 'string' ? [{ text: prompt }] : prompt }],
          generationConfig: sdkGenerationConfig,
        })
      },
      {
        ...CIRCUIT_BREAKER_DEFAULTS.gemini,
        ...(timeoutMs ? { timeoutMs } : {}),
      },
    )
  } catch (error) {
    // Punto único de observabilidad para los ~15 puntos de llamada: sin esto un
    // 4xx del proveedor llega al call site como un mensaje opaco y no se puede
    // distinguir la causa (petición inválida, cuota, modelo inexistente).
    // Solo metadatos: nunca el prompt ni contenido del usuario.
    const details = describeGeminiError(error)
    logger.warn('Gemini request failed', {
      apiStatus: details.apiStatus,
      circuitBreakerName,
      error: details.message,
      httpStatus: details.httpStatus,
      maxOutputTokens: config.maxOutputTokens,
      model: modelName,
      purpose: purpose ?? null,
      reason: details.reason,
      thinkingLevel: effectiveThinkingLevel ?? null,
    })
    throw error
  }

  return {
    text: extractVisibleGeminiText(result.response),
    model: modelName,
    usage: normalizeGeminiUsage(result.response.usageMetadata),
  }
}
