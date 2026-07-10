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
    // getDOMPurify vive en un módulo 'use client': invocarlo desde una ruta o
    // servicio de servidor lanza (client reference), lo que degradaba todo el
    // HTML al fallback del catch. En servidor se usa el sanitizador propio.
    const DOMPurify = typeof window === 'undefined' ? null : getDOMPurify()

    if (DOMPurify) {
      const clean = DOMPurify.sanitize(content, config)
      return basicServerSanitize(
        typeof clean === 'string' ? clean : String(clean),
        config,
      )
    }

    return basicServerSanitize(content, config)
  } catch {
    return content.replace(/<[^>]*>/g, '')
  }
}
