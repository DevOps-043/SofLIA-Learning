import { NextResponse } from 'next/server'

import {
  ServiceStatus,
  StatusComponentKey,
  type DailyUptimeBucket,
  type PublicStatusComponent,
  type PublicStatusResponse,
} from '@aprende-y-aplica/shared'

import { withApiObservability } from '@/lib/observability/api'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const UPTIME_WINDOW_DAYS = 90

interface PublicStatusCurrentRow {
  component_key: string
  status: string
  checked_at: string
}

interface PublicStatusHistoryRow {
  component_key: string
  status_date: string
  worst_status: string
  checks_total: number
  checks_failed: number
}

// The status RPC functions are not yet in the auto-generated Database types;
// same narrow-cast pattern as legacy-progress-resolution.server.service.ts.
type StatusRpcClient = {
  rpc(fn: 'get_public_system_status_current'): PromiseLike<{
    data: PublicStatusCurrentRow[] | null
    error: { message: string } | null
  }>
  rpc(fn: 'get_public_system_status', args: { p_days: number }): PromiseLike<{
    data: PublicStatusHistoryRow[] | null
    error: { message: string } | null
  }>
}

// Public, sanitized status endpoint. Reads exclusively through the
// SECURITY DEFINER functions — error detail and latency never reach this route.
async function getPublicStatus() {
  const supabase = (await createClient()) as unknown as StatusRpcClient

  const [currentResult, historyResult] = await Promise.all([
    supabase.rpc('get_public_system_status_current'),
    supabase.rpc('get_public_system_status', { p_days: UPTIME_WINDOW_DAYS }),
  ])

  if (currentResult.error || historyResult.error) {
    return NextResponse.json(
      { error: 'STATUS_UNAVAILABLE' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const currentRows = currentResult.data ?? []
  const historyRows = historyResult.data ?? []

  const components = buildComponents(currentRows)
  const payload: PublicStatusResponse = {
    overallStatus: worstOf(components.map((component) => component.status)),
    components,
    uptimeDays: buildUptimeDays(historyRows),
    generatedAt: new Date().toISOString(),
  }

  return NextResponse.json(payload, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  })
}

function buildComponents(rows: PublicStatusCurrentRow[]): PublicStatusComponent[] {
  return Object.values(StatusComponentKey).map((key) => {
    const row = rows.find((candidate) => candidate.component_key === key)
    return {
      key,
      status: parseServiceStatus(row?.status),
      updatedAt: row?.checked_at ?? null,
    }
  })
}

function buildUptimeDays(
  rows: PublicStatusHistoryRow[],
): Record<StatusComponentKey, DailyUptimeBucket[]> {
  const byComponent = {} as Record<StatusComponentKey, DailyUptimeBucket[]>

  for (const key of Object.values(StatusComponentKey)) {
    const componentRows = new Map(
      rows
        .filter((row) => row.component_key === key)
        .map((row) => [row.status_date, row]),
    )

    // Gap-fill: one bucket per calendar day (UTC), oldest first; days without
    // checks (pre-launch or collector outage) are explicit no_data.
    const buckets: DailyUptimeBucket[] = []
    for (let daysAgo = UPTIME_WINDOW_DAYS - 1; daysAgo >= 0; daysAgo -= 1) {
      const date = new Date(Date.now() - daysAgo * 86_400_000).toISOString().slice(0, 10)
      const row = componentRows.get(date)
      buckets.push(
        row
          ? {
              date,
              status: parseServiceStatus(row.worst_status),
              checksTotal: Number(row.checks_total),
              checksFailed: Number(row.checks_failed),
            }
          : { date, status: 'no_data', checksTotal: 0, checksFailed: 0 },
      )
    }

    byComponent[key] = buckets
  }

  return byComponent
}

function parseServiceStatus(value: string | undefined): ServiceStatus {
  if (value === ServiceStatus.DEGRADED || value === ServiceStatus.DOWN) return value
  return ServiceStatus.OPERATIONAL
}

function worstOf(statuses: ServiceStatus[]): ServiceStatus {
  if (statuses.includes(ServiceStatus.DOWN)) return ServiceStatus.DOWN
  if (statuses.includes(ServiceStatus.DEGRADED)) return ServiceStatus.DEGRADED
  return ServiceStatus.OPERATIONAL
}

export const GET = withApiObservability('status.public', getPublicStatus)
