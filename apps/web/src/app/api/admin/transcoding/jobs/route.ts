import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

/**
 * Lists transcoding jobs with optional status filtering and basic pagination.
 * Used by the /admin/transcoding dashboard which auto-refreshes the table.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Configuración del servidor incompleta' },
      { status: 500 },
    )
  }

  const url = new URL(request.url)
  const statusParam = url.searchParams.get('status')
  const limitParam = url.searchParams.get('limit')
  const offsetParam = url.searchParams.get('offset')

  const status: JobStatus | null = statusParam && VALID_STATUSES.includes(statusParam as JobStatus)
    ? (statusParam as JobStatus)
    : null
  const limit = Math.min(Math.max(parseInt(limitParam ?? '100', 10) || 100, 1), 200)
  const offset = Math.max(parseInt(offsetParam ?? '0', 10) || 0, 0)

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  let query = supabase
    .from('video_transcoding_jobs')
    .select(
      'id, source_path, source_url, bucket, content_type, size_bytes, status, result_path, result_url, error_message, created_at, started_at, completed_at',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error, count } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Aggregate counts per status for the dashboard summary tiles.
  const { data: aggRows, error: aggError } = await supabase
    .from('video_transcoding_jobs')
    .select('status')
    .order('created_at', { ascending: false })
    .limit(1000) // bounded — sufficient for a dashboard summary

  const summary: Record<JobStatus, number> = {
    queued: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    skipped: 0,
    disabled: 0,
  }
  if (!aggError && aggRows) {
    for (const row of aggRows) {
      if (row.status && row.status in summary) {
        summary[row.status as JobStatus] += 1
      }
    }
  }

  return NextResponse.json({
    jobs: data ?? [],
    total: count ?? 0,
    summary,
    pagination: { limit, offset },
  })
}
