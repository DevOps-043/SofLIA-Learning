import 'server-only'

import { ServiceStatus, StatusErrorClassification } from '@aprende-y-aplica/shared'

import { createAdminClient } from '@/lib/supabase/admin'
import { extractErrorMessage, type StatusCheckResult } from './types'

const DATABASE_CHECK_TIMEOUT_MS = 5_000
const DATABASE_DEGRADED_LATENCY_MS = 2_000

export async function checkDatabaseStatus(): Promise<StatusCheckResult> {
  const startedAt = performance.now()

  try {
    const supabase = createAdminClient()
    const { error } = await withTimeout(
      supabase.from('users').select('id', { count: 'exact', head: true }).limit(1),
      DATABASE_CHECK_TIMEOUT_MS,
    )
    const latencyMs = Math.round(performance.now() - startedAt)

    if (error) {
      return {
        status: ServiceStatus.DEGRADED,
        latencyMs,
        errorClassification: StatusErrorClassification.GENERIC_OUTAGE,
        errorDetail: error.message,
      }
    }

    if (latencyMs > DATABASE_DEGRADED_LATENCY_MS) {
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
    return {
      status: ServiceStatus.DOWN,
      latencyMs: Math.round(performance.now() - startedAt),
      errorClassification: StatusErrorClassification.TIMEOUT,
      errorDetail: extractErrorMessage(error),
    }
  }
}

export function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(
      () => reject(new Error('STATUS_CHECK_TIMEOUT')),
      timeoutMs,
    )

    Promise.resolve(promise)
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeoutId))
  })
}
