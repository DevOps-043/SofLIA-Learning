import { NextRequest, NextResponse } from 'next/server'

import { StatusComponentKey } from '@aprende-y-aplica/shared'

import { runStatusCheckPipeline } from '@/lib/status/run-status-check-pipeline'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const authResponse = validateJobAuthorization(request)
  if (authResponse) return authResponse

  const results: Record<string, unknown> = {}

  for (const componentKey of Object.values(StatusComponentKey)) {
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
  }

  return NextResponse.json({ success: true, results })
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
