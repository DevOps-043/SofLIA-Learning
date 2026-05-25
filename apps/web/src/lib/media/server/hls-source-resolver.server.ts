import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

import { createAdminClient } from '@/lib/supabase/admin'

interface CompletedTranscodingRow {
  completed_at: string | null
  result_url: string | null
  source_path: string | null
  source_url: string | null
}

/**
 * Given source MP4/WebM URLs or storage paths, returns a Map of those
 * references to their corresponding HLS master.m3u8 URL when a completed
 * transcoding job exists. Sources without a completed HLS variant simply do
 * not appear in the returned map, so callers should fall back to the original
 * URL in that case.
 *
 * The lookup uses a service-role client when configured because learners do
 * not have RLS access to the internal job table. Callers still decide which
 * source references are eligible based on their own course-access checks.
 */
export async function resolveHlsUrlsForSources(
  supabase: SupabaseClient,
  sourceUrls: Array<string | null | undefined>,
): Promise<Map<string, string>> {
  const references = Array.from(
    new Set(
      sourceUrls.filter(
        (value): value is string =>
          typeof value === 'string' && value.trim().length > 0,
      ),
    ),
  )

  if (references.length === 0) {
    return new Map()
  }

  const referencesByUrl = new Map<string, string[]>()
  const referencesByPath = new Map<string, string[]>()

  for (const reference of references) {
    if (reference.startsWith('http')) {
      addMapValue(referencesByUrl, reference, reference)
    }

    const sourcePath = extractCourseVideoSourcePath(reference)
    if (sourcePath) {
      addMapValue(referencesByPath, sourcePath, reference)
    }
  }

  const validUrls = Array.from(referencesByUrl.keys())
  const validPaths = Array.from(referencesByPath.keys())

  if (validUrls.length === 0 && validPaths.length === 0) {
    return new Map()
  }

  const rows = await loadCompletedTranscodingRows(
    createLookupClient(supabase),
    validUrls,
    validPaths,
  )

  if (rows.length === 0) {
    return new Map()
  }

  rows.sort((left, right) =>
    getCompletedAtMs(right.completed_at) - getCompletedAtMs(left.completed_at),
  )

  const map = new Map<string, string>()
  for (const row of rows) {
    if (!row.result_url) continue

    const matchingReferences = new Set<string>()
    if (row.source_url) {
      for (const reference of referencesByUrl.get(row.source_url) ?? []) {
        matchingReferences.add(reference)
      }
    }
    if (row.source_path) {
      for (const reference of referencesByPath.get(row.source_path) ?? []) {
        matchingReferences.add(reference)
      }
    }

    for (const reference of matchingReferences) {
      if (!map.has(reference)) {
        map.set(reference, row.result_url)
      }
    }
  }

  return map
}

/**
 * Single-URL convenience wrapper around {@link resolveHlsUrlsForSources}.
 *
 * Returns the HLS master.m3u8 URL when a completed transcoding job exists
 * for the given source, otherwise echoes back the original URL so the caller
 * always has a playable URL. Returns null only when the input is empty.
 */
export async function resolveHlsUrlForSource(
  supabase: SupabaseClient,
  sourceUrl: string | null | undefined,
): Promise<string | null> {
  if (!sourceUrl) return null
  const map = await resolveHlsUrlsForSources(supabase, [sourceUrl])
  return map.get(sourceUrl) ?? sourceUrl
}

function createLookupClient(fallbackClient: SupabaseClient): SupabaseClient {
  try {
    return createAdminClient() as unknown as SupabaseClient
  } catch {
    return fallbackClient
  }
}

async function loadCompletedTranscodingRows(
  supabase: SupabaseClient,
  sourceUrls: string[],
  sourcePaths: string[],
): Promise<CompletedTranscodingRow[]> {
  const queries: Array<Promise<CompletedTranscodingRow[]>> = []

  if (sourceUrls.length > 0) {
    queries.push(loadCompletedRowsByField(supabase, 'source_url', sourceUrls))
  }

  if (sourcePaths.length > 0) {
    queries.push(loadCompletedRowsByField(supabase, 'source_path', sourcePaths))
  }

  const results = await Promise.all(queries)
  return results.flat()
}

async function loadCompletedRowsByField(
  supabase: SupabaseClient,
  field: 'source_path' | 'source_url',
  values: string[],
): Promise<CompletedTranscodingRow[]> {
  const { data, error } = await supabase
    .from('video_transcoding_jobs')
    .select('source_url, source_path, result_url, completed_at')
    .in(field, values)
    .eq('status', 'completed')
    .not('result_url', 'is', null)
    .order('completed_at', { ascending: false })

  return error ? [] : ((data ?? []) as CompletedTranscodingRow[])
}

function addMapValue(map: Map<string, string[]>, key: string, value: string) {
  const current = map.get(key)
  if (current) {
    current.push(value)
    return
  }
  map.set(key, [value])
}

function extractCourseVideoSourcePath(reference: string): string | null {
  const trimmed = reference.trim()
  if (!trimmed) return null

  const pathFromUrl = extractCourseVideoSourcePathFromUrl(trimmed)
  if (pathFromUrl) return pathFromUrl

  const withoutBucket = trimmed.startsWith('course-videos/')
    ? trimmed.slice('course-videos/'.length)
    : trimmed

  return withoutBucket.startsWith('videos/') ? withoutBucket : null
}

function extractCourseVideoSourcePathFromUrl(reference: string): string | null {
  if (!reference.startsWith('http')) return null

  try {
    const { pathname } = new URL(reference)
    const marker = '/storage/v1/object/public/course-videos/'
    const markerIndex = pathname.indexOf(marker)
    if (markerIndex === -1) return null

    return decodeURIComponent(pathname.slice(markerIndex + marker.length))
  } catch {
    return null
  }
}

function getCompletedAtMs(value: string | null): number {
  if (!value) return 0
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp : 0
}
