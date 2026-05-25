import { NextResponse, type NextRequest } from 'next/server'

import { isApmConfigured } from '@/lib/observability/apm'
import { getCircuitBreakerSnapshots } from '@/lib/resilience/circuit-breaker'
import { getMetricsSnapshot } from '@/lib/observability/metrics'
import { withApiObservability } from '@/lib/observability/api'
import { CAPACITY_BUDGET } from '@/lib/performance/capacity-budget'

export const dynamic = 'force-dynamic'

function isAuthorized(request: NextRequest): boolean {
  const token = process.env.OBSERVABILITY_DASHBOARD_TOKEN
  if (!token && process.env.NODE_ENV !== 'production') return true
  if (!token) return false

  const authorization = request.headers.get('authorization')
  return authorization === `Bearer ${token}`
}

function summarizeCircuitBreakers() {
  const snapshots = getCircuitBreakerSnapshots()
  const openBreakers = snapshots.filter((snapshot) => snapshot.state === 'open')

  return {
    status: openBreakers.length > 0 ? 'degraded' : 'ok',
    openCount: openBreakers.length,
    totalCount: snapshots.length,
    snapshots,
  }
}

async function getObservabilityHealth(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const circuitBreakers = summarizeCircuitBreakers()

  return NextResponse.json(
    {
      status: circuitBreakers.status,
      checkedAt: new Date().toISOString(),
      apm: {
        configured: isApmConfigured(),
        provider: isApmConfigured()
          ? process.env.OBSERVABILITY_APM_PROVIDER || 'http'
          : 'disabled',
      },
      circuitBreakers,
      metrics: getMetricsSnapshot(),
      capacityBudget: CAPACITY_BUDGET,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  )
}

export const GET = withApiObservability('observability.health', getObservabilityHealth)
