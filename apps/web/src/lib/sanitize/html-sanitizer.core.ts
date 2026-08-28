import { getConfigForLevel } from './html-sanitizer.config'
import DOMPurify from 'isomorphic-dompurify'
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
    const clean = DOMPurify.sanitize(content, config)
    return basicServerSanitize(
      typeof clean === 'string' ? clean : String(clean),
      config,
    )
  } catch {
    return content.replace(/<[^>]*>/g, '')
  }
}
