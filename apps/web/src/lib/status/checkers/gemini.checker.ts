import 'server-only'

import { ServiceStatus, StatusErrorClassification } from '@aprende-y-aplica/shared'

import { generateGeminiText, getGeminiApiKey } from '@/lib/gemini/client'
import {
  CircuitBreakerOpenError,
  ExternalHttpError,
  OperationTimeoutError,
  getCircuitBreakerSnapshots,
} from '@/lib/resilience/circuit-breaker'
import { extractErrorMessage, type StatusCheckResult } from './types'

// Dedicated breaker so probe traffic never pollutes the production breakers'
// rolling windows (gemini-ai-chat, gemini-dialogue-tutor, etc.).
const STATUS_CHECK_CIRCUIT_BREAKER_NAME = 'gemini-status-check'
const GEMINI_CHECK_TIMEOUT_MS = 8_000
const GEMINI_DEGRADED_LATENCY_MS = 5_000

export async function checkGeminiStatus(): Promise<StatusCheckResult> {
  const startedAt = performance.now()

  if (!getGeminiApiKey()) {
    return {
      status: ServiceStatus.DOWN,
      latencyMs: 0,
      errorClassification: StatusErrorClassification.GENERIC_OUTAGE,
      errorDetail: 'GEMINI_API_KEY_MISSING',
    }
  }

  // If any production Gemini breaker is already open we are mid-outage: report
  // DOWN immediately without spending another API call (relevant when the outage
  // is quota exhaustion — probing would burn quota and delay recovery).
  const openProductionBreaker = getCircuitBreakerSnapshots().find(
    (snapshot) =>
      snapshot.name.startsWith('gemini-')
      && snapshot.name !== STATUS_CHECK_CIRCUIT_BREAKER_NAME
      && snapshot.state === 'open',
  )
  if (openProductionBreaker) {
    return {
      status: ServiceStatus.DOWN,
      latencyMs: 0,
      errorClassification: StatusErrorClassification.GENERIC_OUTAGE,
      errorDetail: `circuit_breaker_open:${openProductionBreaker.name}`,
    }
  }

  try {
    await generateGeminiText({
      circuitBreakerName: STATUS_CHECK_CIRCUIT_BREAKER_NAME,
      prompt: 'ping',
      generationConfig: { maxOutputTokens: 1, temperature: 0 },
      timeoutMs: GEMINI_CHECK_TIMEOUT_MS,
    })

    const latencyMs = Math.round(performance.now() - startedAt)
    if (latencyMs > GEMINI_DEGRADED_LATENCY_MS) {
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

  // Billing/quota signatures per Google docs: 429 RESOURCE_EXHAUSTED (quota/rate
  // exhausted, including prepaid balance at $0) and 400 FAILED_PRECONDITION
  // (billing not enabled / not supported for the project region).
  const isBillingQuota =
    httpStatus === 429
    || /RESOURCE_EXHAUSTED/i.test(detail)
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

// The @google/generative-ai SDK throws GoogleGenerativeAIFetchError with a
// `status` field in recent versions, but older shapes only embed the code in the
// message ("[429 Too Many Requests] ..."). ExternalHttpError (circuit breaker)
// carries it typed. Try each shape defensively.
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
