import type { ZodType } from 'zod'

import { describeAiProviderError } from '@/lib/ai/ai-error'
import type { AiModelPurposeId } from '@/lib/ai/model-settings/purposes'
import type { AiThinkingLevel } from '@/lib/ai/model-settings/thinking'
import {
  generateAiText,
  type AiPromptInput,
} from '@/lib/ai/providers/ai-text-gateway.server'
import type { AiProvider } from '@/lib/ai/providers/provider-registry'
import { evaluatePromptInjectionRisk } from '@/lib/security/prompt-injection-detector'
import { writeSecurityAuditLogAsync } from '@/lib/security/security-audit-log'
import { logger } from '@/lib/utils/logger'

/**
 * Generación con esquema JSON, independiente del proveedor.
 *
 * La salida se parsea y se valida con Zod antes de que ningún punto de llamada
 * la muestre o la persista: el esquema guía al modelo (`responseJsonSchema` en
 * Gemini, `text.format.json_schema` en OpenAI), pero Zod es la garantía real de
 * forma.
 *
 * RESILIENCIA: el aislamiento por fallos lo aporta el circuit breaker del
 * gateway, con un breaker por operación y proveedor. Este módulo no mantiene
 * circuito propio: duplicarlo daría dos ventanas de conteo desincronizadas y
 * dejaría estas llamadas fuera de los snapshots que consulta el panel de estado.
 */

const DEFAULT_TIMEOUT_MS = 25_000
const DEFAULT_TEMPERATURE = 0.2

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
  /**
   * Modelo explícito. Salta la configuración del panel; el proveedor se deduce
   * de su nombre. Omitirlo (lo habitual) hace que manden `purpose` y el panel.
   */
  model?: string
  operation: string
  /**
   * Contenido del turno. Admite una funcion del perfil del modelo para que el
   * punto de llamada elija la variante de prompt del proveedor destino.
   */
  prompt: AiPromptInput
  /**
   * Propósito administrado del que heredar modelo y proveedor. Por defecto,
   * `structured_generation_fallback`.
   */
  purpose?: AiModelPurposeId
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
  provider: AiProvider
  responseTokens: number | null
  value: T
}

function normalizeJsonText(value: string): string {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
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
 * Nombre del esquema exigido por OpenAI. Se deriva de la operación porque es lo
 * único estable y descriptivo que aporta el punto de llamada; la API solo admite
 * letras, números, guion y guion bajo, con un máximo de 64 caracteres.
 */
function buildSchemaName(operation: string): string {
  return operation.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64) || 'structured_output'
}

export async function generateStructuredContent<T>(
  input: StructuredGenerationInput<T>,
): Promise<StructuredGenerationResult<T>> {
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

  // El modelo explícito del punto de llamada tiene precedencia; el propósito
  // cubre a quien no declare uno, y `structured_generation_fallback` es el
  // propósito de respaldo administrable desde el panel.
  const purpose: AiModelPurposeId = input.purpose ?? 'structured_generation_fallback'

  // Se conserva para el registro de errores: si la llamada falla antes de
  // resolverse, el modelo efectivo todavía no se conoce.
  let effectiveModel = input.model ?? `(propósito: ${purpose})`

  try {
    const response = await generateAiText({
      circuitBreakerName: `structured-generation-${input.operation}`,
      jsonSchema: { name: buildSchemaName(input.operation), schema: input.jsonSchema },
      maxOutputTokens: input.maxOutputTokens,
      ...(input.model ? { model: input.model } : {}),
      prompt: input.prompt,
      purpose,
      temperature: input.temperature ?? DEFAULT_TEMPERATURE,
      ...(input.thinkingLevel ? { thinkingLevel: input.thinkingLevel } : {}),
      timeoutMs: input.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    })
    effectiveModel = response.model

    // Una respuesta truncada se distingue de una inválida porque la causa y la
    // solución son distintas: la primera se arregla subiendo `maxOutputTokens`
    // del propósito en el panel. En los modelos con razonamiento interno, este
    // consume del mismo presupuesto, así que ocurre con más frecuencia de lo que
    // sugiere el tamaño del JSON esperado.
    const rawText = normalizeJsonText(response.text)
    if (!rawText) {
      throw new Error(
        response.truncated
          ? 'AI_OUTPUT_TRUNCATED_MAX_TOKENS'
          : 'AI_EMPTY_STRUCTURED_RESPONSE',
      )
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(rawText)
    } catch {
      throw new Error(
        response.truncated ? 'AI_OUTPUT_TRUNCATED_MAX_TOKENS' : 'AI_INVALID_JSON_RESPONSE',
      )
    }

    const value = input.schema.parse(parsed)

    const promptTokens = response.usage?.inputTokens ?? null
    const responseTokens = response.usage?.outputTokens ?? null
    audit(input.audit, 'success', {
      model: response.model,
      operation: input.operation,
      promptTokens,
      provider: response.provider,
      responseTokens,
    })

    return {
      model: response.model,
      promptTokens,
      provider: response.provider,
      responseTokens,
      value,
    }
  } catch (error) {
    // Se registra el detalle completo del error de la API (código HTTP, estado
    // canónico y motivo), no solo el mensaje: un 400 opaco no permite distinguir
    // un esquema inválido de un límite de tokens o de una clave sin permisos.
    const details = describeAiProviderError(error)
    logger.warn('Structured AI generation failed', {
      apiStatus: details.apiStatus,
      error: details.message,
      httpStatus: details.httpStatus,
      maxOutputTokens: input.maxOutputTokens,
      model: effectiveModel,
      operation: input.operation,
      reason: details.reason,
    })
    audit(input.audit, 'error', {
      apiStatus: details.apiStatus,
      errorCode: details.message.slice(0, 160),
      httpStatus: details.httpStatus,
      operation: input.operation,
    })
    throw error
  }
}
