import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export const runtime = 'nodejs'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const { jobId } = await params

  if (!jobId) {
    return NextResponse.json({ error: 'jobId requerido' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Configuración del servidor incompleta' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data: job, error } = await supabase
    .from('video_transcoding_jobs')
    .select('id, status, result_path, result_url, error_message, created_at, started_at, completed_at')
    .eq('id', jobId)
    .single()

  if (error || !job) {
    return NextResponse.json({ error: 'Job no encontrado' }, { status: 404 })
  }

  return NextResponse.json({ job })
}
