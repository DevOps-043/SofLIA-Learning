import { sanitizeSlug } from './sanitize-slug'

export function extractSlugFromUrl(url: string): string {
  if (!url) {
    return ''
  }

  const path = url.replace(/^https?:\/\/[^/]+/, '')
  const segments = path.split('/').filter(Boolean)
  const lastSegment = segments[segments.length - 1] || ''

  return sanitizeSlug(lastSegment)
}
