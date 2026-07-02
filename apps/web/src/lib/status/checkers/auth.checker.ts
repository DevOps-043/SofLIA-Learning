import 'server-only'

import { ServiceStatus, StatusErrorClassification } from '@aprende-y-aplica/shared'

import { createAdminClient } from '@/lib/supabase/admin'
import { extractErrorMessage, type StatusCheckResult } from './types'
import { withTimeout } from './database.checker'

const AUTH_CHECK_TIMEOUT_MS = 5_000
const AUTH_DEGRADED_LATENCY_MS = 2_000

// Exercises the real GoTrue auth subsystem (session/SSO issuing path), not just
// the Postgres connection: a 1-row admin listUsers call.
export async function checkAuthStatus(): Promise<StatusCheckResult> {
  const startedAt = performance.now()

  try {
    const supabase = createAdminClient()
    const { error } = await withTimeout(
      supabase.auth.admin.listUsers({ page: 1, perPage: 1 }),
      AUTH_CHECK_TIMEOUT_MS,
    )
    const latencyMs = Math.round(performance.now() - startedAt)

    if (error) {
      return {
        status: ServiceStatus.DOWN,
        latencyMs,
        errorClassification: StatusErrorClassification.AUTH_FAILURE,
        errorDetail: error.message,
      }
    }

    if (latencyMs > AUTH_DEGRADED_LATENCY_MS) {
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
