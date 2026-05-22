import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

import { parseOffsetPaginationParams } from '@/lib/api/pagination'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export const runtime = 'nodejs'

const VALID_STATUSES = [
  'queued',
  'processing',
  'completed',
  'failed',
  'skipped',
  'disabled',
] as const
type JobStatus = (typeof VALID_STATUSES)[number]

interface TranscodingJobRow {
  bucket: string
  completed_at: string | null
  content_type: string
  created_at: string
  error_message: string | null
  id: string
  result_path: string | null
  result_url: string | null
  size_bytes: number | null
  source_path: string
  source_url: string
  started_at: string | null
  status: JobStatus
}

const JOB_SELECT_FIELDS =
  'id, source_path, source_url, bucket, content_type, size_bytes, status, result_path, result_url, error_message, created_at, started_at, completed_at'
const DASHBOARD_JOB_SCAN_LIMIT = 5000

/**
 * Lists the current transcoding state per source video. Reprocess attempts
 * leave historical rows behind, so the dashboard deduplicates by
 * bucket/source_path and keeps the newest job for counts and filters.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Configuracion del servidor incompleta' },
      { status: 500 },
    )
  }

  const url = new URL(request.url)
  const statusParam = url.searchParams.get('status')

  const status: JobStatus | null =
    statusParam && VALID_STATUSES.includes(statusParam as JobStatus)
      ? (statusParam as JobStatus)
      : null
  const { limit, offset } = parseOffsetPaginationParams(url.searchParams, {
    defaultLimit: 100,
  })

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data, error } = await supabase
    .from('video_transcoding_jobs')
    .select(JOB_SELECT_FIELDS)
    .order('created_at', { ascending: false })
    .limit(DASHBOARD_JOB_SCAN_LIMIT)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const latestJobs = dedupeLatestJobs((data ?? []) as TranscodingJobRow[])
  const filteredJobs = status
    ? latestJobs.filter((job) => job.status === status)
    : latestJobs
  const paginatedJobs = filteredJobs.slice(offset, offset + limit)

  return NextResponse.json({
    jobs: paginatedJobs,
    total: filteredJobs.length,
    summary: summarizeJobs(latestJobs),
    pagination: { limit, offset },
  })
}

function dedupeLatestJobs(rows: TranscodingJobRow[]): TranscodingJobRow[] {
  const latestBySource = new Map<string, TranscodingJobRow>()

  for (const row of rows) {
    const sourceKey = `${row.bucket}:${row.source_path}`
    if (!latestBySource.has(sourceKey)) {
      latestBySource.set(sourceKey, row)
    }
  }

  return Array.from(latestBySource.values())
}

function summarizeJobs(rows: TranscodingJobRow[]): Record<JobStatus, number> {
  const summary: Record<JobStatus, number> = {
    queued: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    skipped: 0,
    disabled: 0,
  }

  for (const row of rows) {
    summary[row.status] += 1
  }

  return summary
}
