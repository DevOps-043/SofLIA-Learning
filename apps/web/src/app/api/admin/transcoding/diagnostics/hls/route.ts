import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

import { requireAdmin } from '@/lib/auth/requireAdmin'
import { resolveHlsUrlsForSources } from '@/lib/media/server/hls-source-resolver.server'
import { isHlsManifestUrl } from '@/lib/media/hls-source'

export const runtime = 'nodejs'

/**
 * HLS resolution diagnostic for a specific lesson.
 *
 * GET /api/admin/transcoding/diagnostics/hls?lessonId=<uuid>
 *
 * Shows the full resolution chain: stored video_provider_id → absolute URL
 * → source_path extracted → DB lookup result.  Lets you pinpoint exactly
 * where the chain breaks when videos play as MP4 instead of HLS.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Supabase env vars not configured' }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const lessonId = searchParams.get('lessonId')

  const supabase = createClient(supabaseUrl, serviceKey)

  // If no lessonId provided, return sample of transcoding jobs to help pick one
  if (!lessonId) {
    const { data: jobs } = await supabase
      .from('video_transcoding_jobs')
      .select('id, source_path, source_url, result_url, status')
      .eq('status', 'completed')
      .not('result_url', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(5)

    const { data: anyJobs } = await supabase
      .from('video_transcoding_jobs')
      .select('id, source_path, source_url, result_url, status')
      .order('completed_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      usage: 'Add ?lessonId=<uuid> to check a specific lesson',
      completedJobsWithHls: jobs ?? [],
      latestJobsAny: anyJobs ?? [],
    })
  }

  // Fetch the lesson
  const { data: lesson, error: lessonError } = await supabase
    .from('course_lessons')
    .select('lesson_id, lesson_title, video_provider, video_provider_id')
    .eq('lesson_id', lessonId)
    .single()

  if (lessonError || !lesson) {
    return NextResponse.json({ error: 'Lesson not found', lessonId }, { status: 404 })
  }

  const raw = lesson.video_provider_id as string | null
  const provider = lesson.video_provider as string | null

  const extractStoragePath = (url: string): string | null => {
    if (!url.startsWith('http')) {
      const withoutBucket = url.startsWith('course-videos/')
        ? url.slice('course-videos/'.length)
        : url
      return withoutBucket.startsWith('videos/') ? withoutBucket : null
    }
    try {
      const { pathname } = new URL(url)
      const marker = '/storage/v1/object/public/course-videos/'
      const idx = pathname.indexOf(marker)
      if (idx === -1) return null
      return decodeURIComponent(pathname.slice(idx + marker.length))
    } catch {
      return null
    }
  }

  // Build the absolute URL (same logic as learn-data-lessons.service.ts)
  const buildAbsoluteVideoUrl = (): string | null => {
    if (!raw) return null
    if (provider !== 'direct') return raw
    if (raw.startsWith('http')) return raw
    if (!supabaseUrl) return raw
    if (!raw.includes('/')) {
      return `${supabaseUrl}/storage/v1/object/public/course-videos/videos/${raw}`
    }
    const normalizedPath = raw.startsWith('course-videos/')
      ? raw
      : `course-videos/${raw}`
    return `${supabaseUrl}/storage/v1/object/public/${normalizedPath}`
  }

  const absoluteUrl = buildAbsoluteVideoUrl()

  const isEligible =
    provider === 'direct' ||
    (provider === 'custom' &&
      ((absoluteUrl ?? '').includes('/storage/v1/object/public/course-videos/') ||
       (absoluteUrl ?? '').includes('/storage/v1/object/public/production-videos/')))

  let hlsResolution: {
    resolvedUrl: string | null
    isM3u8: boolean
    dbRowsFound: number
    completedJobsForPath: number
    sampleJob: unknown
  } | null = null

  if (absoluteUrl && isEligible) {
    const sourcePath = extractStoragePath(absoluteUrl)

    // Check the DB directly using two separate queries (path and url)
    const [byPathResult, byUrlResult] = await Promise.all([
      sourcePath
        ? supabase
            .from('video_transcoding_jobs')
            .select('id, source_path, source_url, result_url, status, completed_at')
            .eq('source_path', sourcePath)
            .order('completed_at', { ascending: false })
            .limit(5)
        : { data: [], error: null },
      supabase
        .from('video_transcoding_jobs')
        .select('id, source_path, source_url, result_url, status, completed_at')
        .eq('source_url', absoluteUrl)
        .order('completed_at', { ascending: false })
        .limit(5),
    ])

    const allDbRows = [
      ...(byPathResult.data ?? []),
      ...(byUrlResult.data ?? []),
    ]

    const completedWithHls = allDbRows.filter(
      (r) => r.status === 'completed' && r.result_url,
    )

    const hlsMap = await resolveHlsUrlsForSources(supabase, [absoluteUrl])
    const resolvedUrl = hlsMap.get(absoluteUrl) ?? null

    hlsResolution = {
      resolvedUrl,
      isM3u8: resolvedUrl ? isHlsManifestUrl(resolvedUrl) : false,
      dbRowsFound: allDbRows.length,
      completedJobsForPath: completedWithHls.length,
      sampleJob: allDbRows[0] ?? null,
    }
  }

  // Simulate exactly what learn-data-lessons.service does to determine
  // which video URL the player receives for this lesson.
  const serviceEligible =
    provider === 'direct' ||
    (provider === 'custom' &&
      ((absoluteUrl ?? '').includes('/storage/v1/object/public/course-videos/') ||
       (absoluteUrl ?? '').includes('/storage/v1/object/public/production-videos/')))

  let serviceResolvedUrl: string | null = null
  if (absoluteUrl && serviceEligible) {
    const serviceHlsMap = await resolveHlsUrlsForSources(supabase, [absoluteUrl])
    serviceResolvedUrl = serviceHlsMap.get(absoluteUrl) ?? null
  }

  const playerWouldReceive = serviceResolvedUrl ?? absoluteUrl ?? raw

  return NextResponse.json({
    lesson: {
      id: lesson.lesson_id,
      title: lesson.lesson_title,
      video_provider: provider,
      video_provider_id_raw: raw,
      video_provider_id_length: raw?.length ?? 0,
    },
    resolution: {
      absoluteUrl,
      extractedSourcePath: absoluteUrl ? extractStoragePath(absoluteUrl) : null,
      isEligibleForHls: isEligible,
      hlsResolution,
    },
    learnDataSimulation: {
      serviceEligible,
      serviceResolvedUrl,
      playerWouldReceive,
      playerWouldReceiveIsHls: playerWouldReceive?.endsWith('.m3u8') ?? false,
    },
    env: {
      supabaseUrlSet: Boolean(supabaseUrl),
      supabaseUrlPrefix: supabaseUrl?.slice(0, 30) ?? null,
    },
  })
}
