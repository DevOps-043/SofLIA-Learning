/**
 * Minimal HLS master playlist parser.
 *
 * Reads `#EXT-X-STREAM-INF` lines from a master.m3u8 to enumerate the
 * available renditions.  No external dependency — the format is simple
 * enough to parse with regex.
 *
 * Spec reference: https://datatracker.ietf.org/doc/html/rfc8216#section-4.3.4.2
 *
 * Example master line we care about:
 *   #EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720
 *   720p/index.m3u8
 *
 * Returns null when the URL is unreachable or doesn't look like a master
 * playlist.  Returns [] when it's an HLS file but contains no variant
 * streams (e.g. it's a media playlist, not a master).
 */

import { fetchWithCircuitBreaker } from '@/lib/resilience/circuit-breaker'

export interface HlsRendition {
  bandwidth: number
  height: number
  width: number
  /** Human-readable label e.g. "1080p". */
  label: string
  /** Absolute URL of this variant's playlist. */
  url: string
}

const STREAM_INF_REGEX = /#EXT-X-STREAM-INF:([^\n]+)/i
const BANDWIDTH_REGEX = /BANDWIDTH=(\d+)/i
const RESOLUTION_REGEX = /RESOLUTION=(\d+)x(\d+)/i

function resolveRelativeUrl(masterUrl: string, relative: string): string {
  if (/^https?:\/\//i.test(relative)) return relative
  try {
    return new URL(relative, masterUrl).toString()
  } catch {
    return relative
  }
}

export async function fetchHlsRenditions(
  masterUrl: string,
  signal?: AbortSignal,
): Promise<HlsRendition[] | null> {
  let response: Response
  try {
    response = await fetchWithCircuitBreaker('hls-master-playlist', masterUrl, {
      signal,
      credentials: 'omit',
    })
  } catch {
    return null
  }
  if (!response.ok) return null

  const text = await response.text()
  if (!text.includes('#EXTM3U')) return null

  return parseHlsMaster(text, masterUrl)
}

/**
 * Parse an already-fetched master.m3u8 string.  Exported for testability.
 */
export function parseHlsMaster(content: string, masterUrl: string): HlsRendition[] {
  const lines = content.split(/\r?\n/)
  const renditions: HlsRendition[] = []

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]?.trim() ?? ''
    if (!line || !STREAM_INF_REGEX.test(line)) continue

    const bandwidthMatch = BANDWIDTH_REGEX.exec(line)
    const resolutionMatch = RESOLUTION_REGEX.exec(line)
    if (!bandwidthMatch || !resolutionMatch) continue

    // The next non-blank, non-comment line is the variant URL.
    let urlLine = ''
    for (let j = i + 1; j < lines.length; j += 1) {
      const candidate = lines[j]?.trim() ?? ''
      if (!candidate) continue
      if (candidate.startsWith('#')) continue
      urlLine = candidate
      break
    }
    if (!urlLine) continue

    const bandwidth = parseInt(bandwidthMatch[1] ?? '0', 10)
    const width = parseInt(resolutionMatch[1] ?? '0', 10)
    const height = parseInt(resolutionMatch[2] ?? '0', 10)
    if (!bandwidth || !width || !height) continue

    renditions.push({
      bandwidth,
      height,
      width,
      label: `${height}p`,
      url: resolveRelativeUrl(masterUrl, urlLine),
    })
  }

  // De-dupe by height keeping the highest bandwidth one, sort desc by height.
  const byHeight = new Map<number, HlsRendition>()
  for (const r of renditions) {
    const existing = byHeight.get(r.height)
    if (!existing || existing.bandwidth < r.bandwidth) {
      byHeight.set(r.height, r)
    }
  }
  return Array.from(byHeight.values()).sort((a, b) => b.height - a.height)
}
