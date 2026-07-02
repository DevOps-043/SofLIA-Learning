import 'server-only'

import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
  type Part,
} from '@google/generative-ai'

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
  systemInstruction?: string
  timeoutMs?: number
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
  systemInstruction,
  timeoutMs,
}: GenerateGeminiTextParams): Promise<GeminiTextResult> {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no esta configurada')
  }

  const modelName = resolveGeminiModel(model)
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

  const config = {
    maxOutputTokens: 8192,
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    ...generationConfig,
  }

  const result = await executeWithCircuitBreaker(
    circuitBreakerName,
    () => {
      if (history) {
        return geminiModel.startChat({
          generationConfig: config,
          history,
        }).sendMessage(prompt)
      }

      return geminiModel.generateContent({
        contents: [{ role: 'user', parts: typeof prompt === 'string' ? [{ text: prompt }] : prompt }],
        generationConfig: config,
      })
    },
    {
      ...CIRCUIT_BREAKER_DEFAULTS.gemini,
      ...(timeoutMs ? { timeoutMs } : {}),
    },
  )

  return {
    text: result.response.text().trim(),
    model: modelName,
    usage: normalizeGeminiUsage(result.response.usageMetadata),
  }
}
