import 'server-only'

import { NextResponse } from 'next/server'
import { getScheduledJobSecret } from './scheduled-job-config'

export function validateScheduledJobAuthorization(request: Request): NextResponse | null {
  const secret = getScheduledJobSecret()
  if (!secret) {
    return NextResponse.json(
      { success: false, error: 'SCHEDULED_JOB_SECRET_NOT_CONFIGURED' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json(
      { success: false, error: 'UNAUTHORIZED_QUEUE_REQUEST' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    )
  }
  return null
}
