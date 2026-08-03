import 'server-only'

import { ServiceStatus, StatusErrorClassification } from '@aprende-y-aplica/shared'

import { getAiModelSettings } from '@/lib/ai/model-settings/ai-model-settings.server.service'
import {
  describeAiProviderCredentialIssue,
  generateAiText,
} from '@/lib/ai/providers/ai-text-gateway.server'
import type { AiProvider } from '@/lib/ai/providers/provider-registry'
import {
  CircuitBreakerOpenError,
  ExternalHttpError,
  OperationTimeoutError,
  getCircuitBreakerSnapshots,
} from '@/lib/resilience/circuit-breaker'
import { extractErrorMessage, type StatusCheckResult } from './types'

/**
 * Sonda de disponibilidad del proveedor de IA que atiende a SofLIA.
 *
 * SONDEA EL PROVEEDOR CONFIGURADO, no Gemini de forma fija: si un
 * superadministrador cambia `lia_general` a un modelo de OpenAI, comprobar
 * Gemini informaría de un servicio que ya no se usa y ocultaría una caída real.
 */

// Breaker propio para que el tráfico de la sonda no contamine las ventanas
// móviles de los breakers de producción (gemini-ai-chat, gemini-dialogue-tutor…).
const STATUS_CHECK_CIRCUIT_BREAKER_NAME = 'ai-status-check'
const AI_CHECK_TIMEOUT_MS = 8_000
const AI_DEGRADED_LATENCY_MS = 5_000
// OpenAI Responses rechaza presupuestos inferiores a 16 tokens. Usar el mismo
// minimo para ambos adaptadores mantiene barata la sonda sin convertir una
// credencial valida en un falso DOWN por una peticion invalida.
export const AI_STATUS_CHECK_MAX_OUTPUT_TOKENS = 16

/**
 * Prefijos de los breakers de producción por proveedor. Se comprueban para
 * detectar una caída en curso sin gastar otra llamada a la API, algo relevante
 * cuando la avería es agotamiento de cuota: sondear quemaría cuota y retrasaría
 * la recuperación.
 */
const PRODUCTION_BREAKER_SUFFIX: Record<AiProvider, string> = {
  google: ':google',
  openai: ':openai',
}

function findOpenProductionBreaker(provider: AiProvider): string | null {
  const suffix = PRODUCTION_BREAKER_SUFFIX[provider]

  const openBreaker = getCircuitBreakerSnapshots().find(
    (snapshot) =>
      snapshot.name.endsWith(suffix)
      && !snapshot.name.startsWith(STATUS_CHECK_CIRCUIT_BREAKER_NAME)
      && snapshot.state === 'open',
  )

  return openBreaker?.name ?? null
}

export async function checkGeminiStatus(): Promise<StatusCheckResult> {
  const startedAt = performance.now()

  // Nunca lanza: degrada a entorno/defaults si la base falla.
  const settings = await getAiModelSettings('lia_general')

  const credentialIssue = describeAiProviderCredentialIssue(settings.provider)
  if (credentialIssue) {
    return {
      status: ServiceStatus.DOWN,
      latencyMs: 0,
      errorClassification: StatusErrorClassification.AUTH_FAILURE,
      errorDetail: credentialIssue,
    }
  }

  const openProductionBreaker = findOpenProductionBreaker(settings.provider)
  if (openProductionBreaker) {
    return {
      status: ServiceStatus.DOWN,
      latencyMs: 0,
      errorClassification: StatusErrorClassification.GENERIC_OUTAGE,
      errorDetail: `circuit_breaker_open:${openProductionBreaker}`,
    }
  }

  try {
    await generateAiText({
      circuitBreakerName: STATUS_CHECK_CIRCUIT_BREAKER_NAME,
      maxOutputTokens: AI_STATUS_CHECK_MAX_OUTPUT_TOKENS,
      model: settings.model,
      prompt: 'ping',
      provider: settings.provider,
      temperature: 0,
      timeoutMs: AI_CHECK_TIMEOUT_MS,
    })

    const latencyMs = Math.round(performance.now() - startedAt)
    if (latencyMs > AI_DEGRADED_LATENCY_MS) {
      return {
        status: ServiceStatus.DEGRADED,
        latencyMs,
        errorClassification: StatusErrorClassification.LATENCY_DEGRADED,
        errorDetail: null,
      }
    }

    return {
      status: ServiceStatus.OPERATIONAL,
      latencyMs,
      errorClassification: StatusErrorClassification.NONE,
      errorDetail: null,
    }
  } catch (error) {
    return classifyGeminiError(error, Math.round(performance.now() - startedAt))
  }
}

export function classifyGeminiError(error: unknown, latencyMs: number): StatusCheckResult {
  if (error instanceof CircuitBreakerOpenError) {
    return {
      status: ServiceStatus.DOWN,
      latencyMs,
      errorClassification: StatusErrorClassification.GENERIC_OUTAGE,
      errorDetail: `circuit_breaker_open:${error.provider}`,
    }
  }

  if (error instanceof OperationTimeoutError) {
    return {
      status: ServiceStatus.DEGRADED,
      latencyMs,
      errorClassification: StatusErrorClassification.TIMEOUT,
      errorDetail: `timeout_${error.timeoutMs}ms`,
    }
  }

  const httpStatus = extractHttpStatus(error)
  const detail = truncateDetail(extractErrorMessage(error))

  // Firmas de facturación/cuota de ambos proveedores:
  // - Google: 429 RESOURCE_EXHAUSTED (cuota o saldo prepago a 0) y 400
  //   FAILED_PRECONDITION (facturación no habilitada o región no soportada).
  // - OpenAI: 429 con `insufficient_quota` o `rate_limit_exceeded`, y 402
  //   cuando el proyecto se queda sin crédito.
  const isBillingQuota =
    httpStatus === 429
    || httpStatus === 402
    || /RESOURCE_EXHAUSTED/i.test(detail)
    || /insufficient_quota|rate_limit_exceeded|billing_hard_limit/i.test(detail)
    || (httpStatus === 400 && /FAILED_PRECONDITION/i.test(detail))
    || /FAILED_PRECONDITION/i.test(detail)

  if (isBillingQuota) {
    return {
      status: ServiceStatus.DOWN,
      latencyMs,
      errorClassification: StatusErrorClassification.BILLING_QUOTA,
      errorDetail: detail,
    }
  }

  return {
    status: ServiceStatus.DOWN,
    latencyMs,
    errorClassification: StatusErrorClassification.GENERIC_OUTAGE,
    errorDetail: detail,
  }
}

// El SDK de Google lanza GoogleGenerativeAIFetchError con un campo `status` en
// las versiones recientes, pero las formas antiguas solo incrustan el código en
// el mensaje ("[429 Too Many Requests] ..."). El de OpenAI expone `status`
// directamente. ExternalHttpError (circuit breaker) lo lleva tipado. Se prueba
// cada forma de manera defensiva.
function extractHttpStatus(error: unknown): number | null {
  if (error instanceof ExternalHttpError) return error.status

  if (error && typeof error === 'object') {
    const status = (error as { status?: unknown }).status
    if (typeof status === 'number') return status
  }

  const message = extractErrorMessage(error)
  const match = message.match(/\[?(\b[45]\d{2}\b)/)
  return match ? Number(match[1]) : null
}

function truncateDetail(detail: string): string {
  return detail.length > 500 ? detail.slice(0, 500) : detail
}
