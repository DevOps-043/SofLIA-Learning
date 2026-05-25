import { NextRequest, NextResponse } from 'next/server'

import { processDuePrivacyDeletions } from '@/lib/privacy/deletion-processor'
import { logger } from '@/lib/utils/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const authResponse = validateJobAuthorization(request)
  if (authResponse) return authResponse

  try {
    const result = await processDuePrivacyDeletions()
    if (result.errors.length > 0) {
      logger.warn('privacy.deletion_job.partial_failure', result)
    }

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    logger.error('privacy.deletion_job.failed', {
      message: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json({ success: false, error: 'PRIVACY_DELETION_JOB_FAILED' }, { status: 500 })
  }
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
