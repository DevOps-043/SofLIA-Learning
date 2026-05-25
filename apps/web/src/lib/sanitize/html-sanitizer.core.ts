import { getConfigForLevel } from './html-sanitizer.config'
import { getDOMPurify } from './html-sanitizer.dompurify'
import { basicServerSanitize } from './html-sanitizer.server'
import type { SanitizeOptions, SanitizerConfig } from './html-sanitizer.types'

function getEffectiveConfig(options: SanitizeOptions): SanitizerConfig {
  const { level = 'basic', customConfig } = options
  const config = getConfigForLevel(level)
  return customConfig ? { ...config, ...customConfig } : config
}

function truncateContent(content: string, maxLength?: number): string {
  if (!maxLength || content.length <= maxLength) {
    return content
  }

  return `${content.substring(0, maxLength)}...`
}

export function sanitizeHtml(
  dirtyHtml: string | null | undefined,
  options: SanitizeOptions = {},
): string {
  if (!dirtyHtml) return ''

  const content = truncateContent(dirtyHtml, options.maxLength)
  const config = getEffectiveConfig(options)

  try {
    const DOMPurify = getDOMPurify()

    if (DOMPurify) {
      const clean = DOMPurify.sanitize(content, config)
      return typeof clean === 'string' ? clean : String(clean)
    }

    return basicServerSanitize(content, config.ALLOWED_TAGS || [])
  } catch {
    return content.replace(/<[^>]*>/g, '')
  }
}
