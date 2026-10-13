import { NextRequest, NextResponse } from 'next/server'
import { validateScheduledJobAuthorization } from '@/lib/jobs/scheduled-job-auth'

import { StatusComponentKey } from '@aprende-y-aplica/shared'

import { runStatusCheckPipeline } from '@/lib/status/run-status-check-pipeline'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const authResponse = validateScheduledJobAuthorization(request)
  if (authResponse) return authResponse

  const results: Record<string, unknown> = {}

  await Promise.all(Object.values(StatusComponentKey).map(async (componentKey) => {
    try {
      const result = await runStatusCheckPipeline(componentKey, 'cron')
      results[componentKey] = {
        status: result.status,
        latencyMs: result.latencyMs,
        errorClassification: result.errorClassification,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logger.error('status.cron.component_check_failed', {
        componentKey,
        error: message,
      })
      results[componentKey] = { error: message }
    }
  }))

  return NextResponse.json({ success: true, results })
}
