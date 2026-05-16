import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Given a list of source MP4/WebM URLs, returns a Map of those URLs to
 * their corresponding HLS master.m3u8 URL when a completed transcoding
 * job exists.  Sources without a completed HLS variant simply do not
 * appear in the returned map — the caller should fall back to the
 * original URL in that case.
 *
 * Designed for batch resolution (one query per page load) so that the
 * lesson list service doesn't fall into N+1 territory.
 *
 * Returns an empty map when the input is empty or transcoding is off.
 */
export async function resolveHlsUrlsForSources(
  supabase: SupabaseClient,
  sourceUrls: Array<string | null | undefined>,
): Promise<Map<string, string>> {
  const validUrls = Array.from(
    new Set(
      sourceUrls.filter(
        (value): value is string =>
          typeof value === 'string' && value.length > 0 && value.startsWith('http'),
      ),
    ),
  )

  if (validUrls.length === 0) {
    return new Map()
  }

  // Service-role queries this table; admin users have RLS access too.
  // Failures here are non-fatal: we just fall back to the original MP4.
  const { data, error } = await supabase
    .from('video_transcoding_jobs')
    .select('source_url, result_url, completed_at')
    .in('source_url', validUrls)
    .eq('status', 'completed')
    .not('result_url', 'is', null)
    .order('completed_at', { ascending: false })

  if (error || !data) {
    return new Map()
  }

  // Multiple completed jobs for the same source are possible (re-runs).
  // Keep the most recently completed one — guaranteed by the order above
  // and the first-wins semantics of Map.set when iterated in order.
  const map = new Map<string, string>()
  for (const row of data) {
    if (!row.source_url || !row.result_url) continue
    if (map.has(row.source_url)) continue
    map.set(row.source_url, row.result_url)
  }
  return map
}
