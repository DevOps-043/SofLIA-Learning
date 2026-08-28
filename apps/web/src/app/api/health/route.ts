import { NextResponse, type NextRequest } from 'next/server'

import { withApiObservability } from '@/lib/observability/api'
import { isApmConfigured } from '@/lib/observability/apm'
import { getOrCreateCorrelationId } from '@/lib/observability/correlation'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

type HealthStatus = 'ok' | 'degraded' | 'down'

interface DependencyHealth {
  status: HealthStatus
  responseTimeMs: number
  message?: string
}

const HEALTH_CHECK_TIMEOUT_MS = 1500

function elapsedSince(startedAt: number) {
  return Math.round(performance.now() - startedAt)
}

function summarizeStatus(checks: Record<string, DependencyHealth>): HealthStatus {
  if (Object.values(checks).some((check) => check.status === 'down')) {
    return 'down'
  }

  if (Object.values(checks).some((check) => check.status === 'degraded')) {
    return 'degraded'
  }

  return 'ok'
}

function timeout<T>(promise: PromiseLike<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new Error('HEALTH_CHECK_TIMEOUT')), timeoutMs)

    Promise.resolve(promise)
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeoutId))
  })
}

async function checkDatabase(): Promise<DependencyHealth> {
  const startedAt = performance.now()

  try {
    const supabase = createAdminClient()
    const { error } = await timeout(
      supabase.from('users').select('id', { count: 'exact', head: true }).limit(1),
      HEALTH_CHECK_TIMEOUT_MS,
    )

    if (error) {
      return {
        status: 'degraded',
        responseTimeMs: elapsedSince(startedAt),
        message: error.code || 'SUPABASE_QUERY_FAILED',
      }
    }

    return { status: 'ok', responseTimeMs: elapsedSince(startedAt) }
  } catch (error) {
    return {
      status: 'down',
      responseTimeMs: elapsedSince(startedAt),
      message: error instanceof Error ? error.message : 'DATABASE_HEALTH_CHECK_FAILED',
    }
  }
}

function checkConfiguredDependency(envNames: readonly string[]): DependencyHealth {
  const startedAt = performance.now()
  const configured = envNames.some((envName) => Boolean(process.env[envName]?.trim()))

  return {
    status: configured ? 'ok' : 'degraded',
    responseTimeMs: elapsedSince(startedAt),
    message: configured ? undefined : `${envNames.join('_OR_')}_MISSING`,
  }
}

async function healthHandler(request: NextRequest) {
  const checks = {
    database: await checkDatabase(),
    gemini: checkConfiguredDependency(['GOOGLE_API_KEY', 'GEMINI_API_KEY']),
    observability: {
      status: isApmConfigured() ? 'ok' : 'degraded',
      responseTimeMs: 0,
      message: isApmConfigured() ? undefined : 'OBSERVABILITY_APM_ENDPOINT_MISSING',
    } satisfies DependencyHealth,
  }
  const status = summarizeStatus(checks)
  if (status !== 'ok') {
    logger.warn('Public health check degraded', { checks, status })
  }

  return NextResponse.json(
    {
      status,
      checkedAt: new Date().toISOString(),
      correlationId: getOrCreateCorrelationId(request.headers),
    },
    {
      status: status === 'down' ? 503 : 200,
      headers: { 'Cache-Control': 'no-store' },
    },
  )
}

export const GET = withApiObservability('health', healthHandler)
