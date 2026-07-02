import { NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth/requireAdmin'
import { getCircuitBreakerSnapshots } from '@/lib/resilience/circuit-breaker'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// ~50 checks per component for the admin detail table and latency chart.
const ADMIN_CHECKS_LIMIT = 150

interface AdminStatusCheckDbRow {
  id: number
  checked_at: string
  component_key: string
  status: string
  latency_ms: number
  error_classification: string
  error_detail: string | null
  triggered_by: string
}

type StatusChecksReadClient = {
  from(table: 'system_status_checks'): {
    select(columns: string): {
      order(column: 'checked_at', options: { ascending: boolean }): {
        limit(count: number): PromiseLike<{
          data: AdminStatusCheckDbRow[] | null
          error: { message: string } | null
        }>
      }
    }
  }
}

export async function GET() {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const supabase = createAdminClient() as unknown as StatusChecksReadClient
  const { data, error } = await supabase
    .from('system_status_checks')
    .select('id, checked_at, component_key, status, latency_ms, error_classification, error_detail, triggered_by')
    .order('checked_at', { ascending: false })
    .limit(ADMIN_CHECKS_LIMIT)

  if (error) {
    return NextResponse.json(
      { success: false, error: 'STATUS_CHECKS_QUERY_FAILED' },
      { status: 500 },
    )
  }

  const checks = (data ?? []).map((row) => ({
    id: row.id,
    componentKey: row.component_key,
    status: row.status,
    latencyMs: row.latency_ms,
    errorClassification: row.error_classification,
    errorDetail: row.error_detail,
    triggeredBy: row.triggered_by,
    checkedAt: row.checked_at,
  }))

  const circuitBreakers = getCircuitBreakerSnapshots().filter((snapshot) =>
    snapshot.name.startsWith('gemini-'),
  )

  return NextResponse.json(
    { success: true, checks, circuitBreakers, generatedAt: new Date().toISOString() },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
