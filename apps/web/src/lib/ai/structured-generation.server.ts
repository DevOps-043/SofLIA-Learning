import { GoogleGenAI } from '@google/genai'
import type { ZodType } from 'zod'

import { getAiModelSettings } from '@/lib/ai/model-settings/ai-model-settings.server.service'
import { buildThinkingConfig, type AiThinkingLevel } from '@/lib/ai/model-settings/thinking'

import { evaluatePromptInjectionRisk } from '@/lib/security/prompt-injection-detector'
import { writeSecurityAuditLogAsync } from '@/lib/security/security-audit-log'
import { logger } from '@/lib/utils/logger'

const DEFAULT_MODEL = 'gemini-3.5-flash'
const DEFAULT_TIMEOUT_MS = 25_000
const CIRCUIT_FAILURE_THRESHOLD = 3
const CIRCUIT_COOLDOWN_MS = 60_000

interface CircuitState {
  failures: number
  openedUntil: number | null
}

const circuits = new Map<string, CircuitState>()

export interface StructuredGenerationAuditContext {
  action: string
  actorId?: string | null
  organizationId?: string | null
  resourceId?: string | null
  resourceType: string
}

export interface StructuredGenerationInput<T> {
  audit?: StructuredGenerationAuditContext
  jsonSchema: Record<string, unknown>
  maxOutputTokens: number
  model?: string
  operation: string
  prompt: string
  schema: ZodType<T>
  temperature?: number
  /** Nivel de razonamiento; normalmente proviene del propósito administrado. */
  thinkingLevel?: AiThinkingLevel
  timeoutMs?: number
  /** Only user-authored text belongs here. It is scanned, never logged. */
  untrustedText?: string
}

export interface StructuredGenerationResult<T> {
  model: string
  promptTokens: number | null
  responseTokens: number | null
  value: T
}

export class StructuredGenerationCircuitOpenError extends Error {
  constructor(operation: string) {
    super(`AI_CIRCUIT_OPEN:${operation}`)
    this.name = 'StructuredGenerationCircuitOpenError'
  }
}

function normalizeJsonText(value: string): string {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

function getCircuit(operation: string): CircuitState {
  const existing = circuits.get(operation)
  if (existing) return existing
  const state = { failures: 0, openedUntil: null }
  circuits.set(operation, state)
  return state
}

function assertCircuitAvailable(operation: string): void {
  const circuit = getCircuit(operation)
  if (!circuit.openedUntil) return

  if (circuit.openedUntil <= Date.now()) {
    circuit.failures = 0
    circuit.openedUntil = null
    return
  }

  throw new StructuredGenerationCircuitOpenError(operation)
}

function recordFailure(operation: string): void {
  const circuit = getCircuit(operation)
  circuit.failures += 1
  if (circuit.failures >= CIRCUIT_FAILURE_THRESHOLD) {
    circuit.openedUntil = Date.now() + CIRCUIT_COOLDOWN_MS
  }
}

function recordSuccess(operation: string): void {
  circuits.set(operation, { failures: 0, openedUntil: null })
}

function audit(
  context: StructuredGenerationAuditContext | undefined,
  result: 'success' | 'error' | 'denied',
  metadata: Record<string, unknown>,
): void {
  if (!context?.actorId) return

  writeSecurityAuditLogAsync({
    action: context.action,
    actorId: context.actorId,
    metadata,
    orgId: context.organizationId || undefined,
    resourceId: context.resourceId || undefined,
    resourceType: context.resourceType,
    result,
  })
}

/**
 * Shared schema-bound Gemini client for notebook generation. Model output is
 * parsed as JSON and validated before any caller renders or persists it.
 */
export async function generateStructuredContent<T>(
  input: StructuredGenerationInput<T>,
): Promise<StructuredGenerationResult<T>> {
  assertCircuitAvailable(input.operation)

  if (input.untrustedText) {
    const risk = evaluatePromptInjectionRisk({ message: input.untrustedText })
    if (risk.action === 'block') {
      audit(input.audit, 'denied', {
        categories: risk.categories,
        operation: input.operation,
        score: risk.score,
      })
      throw new Error('AI_INPUT_BLOCKED_PROMPT_INJECTION')
    }
  }

  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY no esta configurada.')

  // El propósito administrado del punto de llamada tiene precedencia; el
  // propósito de respaldo cubre a quien no declare uno explícito.
  const fallbackSettings = input.model
    ? null
    : await getAiModelSettings('structured_generation_fallback')
  const model = input.model || fallbackSettings?.model || DEFAULT_MODEL
  const thinkingConfig = buildThinkingConfig(
    input.thinkingLevel ?? fallbackSettings?.thinkingLevel ?? 'default',
  )
  const controller = new AbortController()
  const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { timeout: timeoutMs },
    })
    const response = await ai.models.generateContent({
      contents: input.prompt,
      model,
      config: {
        abortSignal: controller.signal,
        maxOutputTokens: input.maxOutputTokens,
        responseJsonSchema: input.jsonSchema,
        responseMimeType: 'application/json',
        temperature: input.temperature ?? 0.2,
        ...(thinkingConfig ? { thinkingConfig } : {}),
      },
    })

    const rawText = normalizeJsonText(response.text || '')
    if (!rawText) throw new Error('AI_EMPTY_STRUCTURED_RESPONSE')

    let parsed: unknown
    try {
      parsed = JSON.parse(rawText)
    } catch {
      throw new Error('AI_INVALID_JSON_RESPONSE')
    }

    const value = input.schema.parse(parsed)
    recordSuccess(input.operation)

    const promptTokens = response.usageMetadata?.promptTokenCount ?? null
    const responseTokens = response.usageMetadata?.candidatesTokenCount ?? null
    audit(input.audit, 'success', {
      model,
      operation: input.operation,
      promptTokens,
      responseTokens,
    })

    return { model, promptTokens, responseTokens, value }
  } catch (error) {
    recordFailure(input.operation)
    const message = error instanceof Error ? error.message : 'Unknown AI error'
    logger.warn('Structured AI generation failed', {
      error: message,
      operation: input.operation,
    })
    audit(input.audit, 'error', {
      errorCode: message.slice(0, 160),
      operation: input.operation,
    })
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

/** Test-only reset kept explicit so circuit tests never leak process state. */
export function resetStructuredGenerationCircuits(): void {
  circuits.clear()
}
