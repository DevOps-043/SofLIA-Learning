import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { StatusComponentKey } from '@aprende-y-aplica/shared'

import { requireAdmin } from '@/lib/auth/requireAdmin'
import { writeSecurityAuditLogAsync } from '@/lib/security/security-audit-log'
import { runStatusCheckPipeline } from '@/lib/status/run-status-check-pipeline'

export const dynamic = 'force-dynamic'

const RunCheckSchema = z.object({
  componentKey: z.nativeEnum(StatusComponentKey),
})

// Prevents an admin from hammering the Gemini API with repeated manual clicks.
const MANUAL_CHECK_COOLDOWN_MS = 10_000
const lastManualCheckByAdmin = new Map<string, number>()

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const body = await request.json().catch(() => null)
  const parsed = RunCheckSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'INVALID_COMPONENT_KEY' },
      { status: 400 },
    )
  }

  const now = Date.now()
  const lastRun = lastManualCheckByAdmin.get(auth.userId) ?? 0
  if (now - lastRun < MANUAL_CHECK_COOLDOWN_MS) {
    return NextResponse.json(
      { success: false, error: 'MANUAL_CHECK_COOLDOWN' },
      { status: 429 },
    )
  }
  lastManualCheckByAdmin.set(auth.userId, now)

  const result = await runStatusCheckPipeline(
    parsed.data.componentKey,
    'manual',
    auth.userId,
  )

  writeSecurityAuditLogAsync({
    action: 'admin.system_status.manual_check',
    result: 'success',
    actorId: auth.userId,
    actorRole: auth.userRole,
    resourceType: 'system_status_checks',
    resourceId: parsed.data.componentKey,
    metadata: {
      status: result.status,
      errorClassification: result.errorClassification,
      latencyMs: result.latencyMs,
    },
  })

  return NextResponse.json({ success: true, result })
}
