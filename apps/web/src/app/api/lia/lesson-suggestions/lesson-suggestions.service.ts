import type { PromptModelProfile } from '@/lib/ai/prompts'
import { generateAiText } from '@/lib/ai/providers/ai-text-gateway.server'
import { logger as techDebtLogger } from '@/lib/utils/logger'

import { buildLessonSuggestionsPrompt } from './lesson-suggestions.prompt'
import {
  SUGGESTIONS_PER_LESSON,
  SUGGESTION_TEXT_MAX,
  SUGGESTION_TEXT_MIN,
  type LessonContextSnapshot,
  type LessonSuggestionItem,
} from './lesson-suggestions.types'

const AI_TIMEOUT_MS = 20_000

export class LessonSuggestionsGenerationError extends Error {
  readonly cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'LessonSuggestionsGenerationError'
    this.cause = cause
  }
}

interface ParsedGeminiPayload {
  suggestions: unknown
}

/**
 * Extracts JSON from a Gemini response that may be wrapped in markdown
 * code fences (```json ... ```) or contain leading/trailing whitespace.
 */
function extractJsonFromResponse(raw: string): string {
  const trimmed = raw.trim()

  // Strip markdown code fences: ```json\n...\n``` or ```\n...\n```
  const fencePattern = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/
  const fenceMatch = fencePattern.exec(trimmed)
  if (fenceMatch) {
    return fenceMatch[1].trim()
  }

  // If the response starts with { or [, it's likely raw JSON
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return trimmed
  }

  // Last resort: find first { ... last } block
  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1)
  }

  return trimmed
}

function parseGeminiPayload(raw: string): ParsedGeminiPayload {
  const jsonString = extractJsonFromResponse(raw)

  try {
    return JSON.parse(jsonString) as ParsedGeminiPayload
  } catch (error) {
    techDebtLogger.warn(
      '[lesson-suggestions] failed to parse Gemini JSON',
      { rawLength: raw.length, rawPreview: raw.slice(0, 300) },
    )
    throw new LessonSuggestionsGenerationError(
      'Gemini returned malformed JSON for lesson suggestions',
      error,
    )
  }
}

function normalizeSuggestionText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim().replace(/\s+/g, ' ')

  if (
    trimmed.length < SUGGESTION_TEXT_MIN ||
    trimmed.length > SUGGESTION_TEXT_MAX
  ) {
    return null
  }

  return trimmed
}

function ensureUniqueTexts(texts: string[]): string[] {
  const seen = new Set<string>()
  const unique: string[] = []

  for (const text of texts) {
    const key = text.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(text)
    }
  }

  return unique
}

function buildSuggestionItems(
  texts: string[],
  contentHash: string,
): LessonSuggestionItem[] {
  return texts.map((text, index) => ({
    id: `${contentHash}-${String(index)}`,
    text,
  }))
}

export interface GenerateLessonSuggestionsArgs {
  snapshot: LessonContextSnapshot
  contentHash: string
  /**
   * Modelo explícito. Salta la configuración del panel; el proveedor se deduce
   * de su nombre. Reservado para pruebas y diagnóstico.
   */
  modelName?: string
}

export async function generateLessonSuggestions(
  args: GenerateLessonSuggestionsArgs,
): Promise<LessonSuggestionItem[]> {
  const { snapshot, contentHash, modelName } = args

  const result = await generateAiText({
    circuitBreakerName: 'lia-lesson-suggestions',
    ...(modelName ? { model: modelName } : {}),
    prompt: (profile: PromptModelProfile) => buildLessonSuggestionsPrompt(profile, snapshot),
    purpose: 'lia_lesson_suggestions',
    // No administrable: la respuesta se parsea como JSON obligatoriamente.
    responseAsJson: true,
    timeoutMs: AI_TIMEOUT_MS,
  })

  const rawText = result.text

  if (result.truncated) {
    techDebtLogger.warn('[lesson-suggestions] respuesta truncada por presupuesto de tokens', {
      model: result.model,
      provider: result.provider,
      rawLength: rawText.length,
      usage: result.usage,
    })
  }

  const payload = parseGeminiPayload(rawText)

  if (!Array.isArray(payload.suggestions)) {
    throw new LessonSuggestionsGenerationError(
      'Gemini payload is missing suggestions array',
    )
  }

  const normalized = payload.suggestions
    .map((entry) => normalizeSuggestionText(entry))
    .filter((entry): entry is string => entry !== null)

  const unique = ensureUniqueTexts(normalized)

  if (unique.length < SUGGESTIONS_PER_LESSON) {
    throw new LessonSuggestionsGenerationError(
      `Gemini returned ${String(unique.length)} valid suggestions; expected ${String(
        SUGGESTIONS_PER_LESSON,
      )}`,
    )
  }

  return buildSuggestionItems(
    unique.slice(0, SUGGESTIONS_PER_LESSON),
    contentHash,
  )
}
