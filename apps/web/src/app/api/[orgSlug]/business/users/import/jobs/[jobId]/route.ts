import { NextRequest, NextResponse } from 'next/server'

import { requireBusiness } from '@/lib/auth/requireBusiness'
import { getQueueJobForOrganization } from '@/lib/queue/job-store.server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string; orgSlug: string }> },
) {
  const { jobId, orgSlug } = await params
  const auth = await requireBusiness({ organizationSlug: orgSlug })
  if (auth instanceof NextResponse) return auth

  if (!auth.organizationId) {
    return NextResponse.json(
      { success: false, error: 'No autorizado' },
      { status: 403 },
    )
  }

  const job = await getQueueJobForOrganization({
    jobId,
    organizationId: auth.organizationId,
  })

  if (!job) {
    return NextResponse.json(
      { success: false, error: 'Job no encontrado' },
      { status: 404 },
    )
  }

  return NextResponse.json({
    success: true,
    job: {
      attempts: job.attempts,
      completedAt: job.completed_at,
      error: job.error_message,
      id: job.job_id,
      jobName: job.job_name,
      queuedAt: job.queued_at,
      result: job.result,
      startedAt: job.started_at,
      status: job.status,
      updatedAt: job.updated_at,
    },
  })
}
