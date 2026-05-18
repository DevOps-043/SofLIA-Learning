import { NextRequest, NextResponse } from 'next/server'

import {
  evaluateSecurityAuditAlerts,
  type SecurityAuditEventForAlerting,
} from '@/lib/security/security-alerts'
import { writeSecurityAuditLog } from '@/lib/security/security-audit-log'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const LOOKBACK_HOURS = 1

export async function POST(request: NextRequest) {
  const authResponse = validateJobAuthorization(request)
  if (authResponse) return authResponse

  const since = new Date(Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000).toISOString()
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('security_audit_log')
    .select('action, actor_id, ip, occurred_at, result')
    .gte('occurred_at', since)
    .order('occurred_at', { ascending: false })
    .limit(5_000)

  if (error) {
    logger.error('security.alert_job.query_failed', { error: error.message })
    return NextResponse.json({ success: false, error: 'QUERY_FAILED' }, { status: 500 })
  }

  const alerts = evaluateSecurityAuditAlerts(
    (data ?? []) as SecurityAuditEventForAlerting[],
  )

  for (const alert of alerts) {
    logger.warn('security.alert_triggered', alert)
    await writeSecurityAuditLog({
      action: 'security-alert',
      resourceType: 'security_alert',
      resourceId: alert.code,
      result: 'success',
      metadata: {
        code: alert.code,
        group: alert.group,
        observed: alert.observed,
        severity: alert.severity,
        threshold: alert.threshold,
        windowMinutes: alert.windowMinutes,
      },
    })
  }

  return NextResponse.json({
    success: true,
    alerts,
    scanned: data?.length ?? 0,
  })
}

function validateJobAuthorization(request: NextRequest): NextResponse | null {
  const expectedSecret = process.env.QUEUE_INTERNAL_SECRET
  if (!expectedSecret) {
    return NextResponse.json(
      { success: false, error: 'QUEUE_INTERNAL_SECRET_NOT_CONFIGURED' },
      { status: 500 },
    )
  }

  if (request.headers.get('authorization') !== `Bearer ${expectedSecret}`) {
    return NextResponse.json(
      { success: false, error: 'UNAUTHORIZED_QUEUE_REQUEST' },
      { status: 401 },
    )
  }

  return null
}
