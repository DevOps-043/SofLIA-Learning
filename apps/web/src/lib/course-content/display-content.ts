import { escapeHtml, looksLikeHtml } from './html'
import { collectContentSegments } from './segments'

export function extractDisplayContent(value: unknown): string | null {
  const segments = collectContentSegments(value)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)

  if (segments.length === 0) return null

  const hasHtml = segments.some(looksLikeHtml)
  if (!hasHtml) return segments.join('\n\n')

  return segments
    .map((segment) => (looksLikeHtml(segment) ? segment : `<p>${escapeHtml(segment)}</p>`))
    .join('')
}
