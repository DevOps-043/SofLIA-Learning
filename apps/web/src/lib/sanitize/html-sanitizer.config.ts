import type { SanitizationLevel, SanitizerConfig } from './html-sanitizer.types'

const TEXT_TAGS = ['p', 'br', 'span', 'div']
const FORMAT_TAGS = ['strong', 'em', 'u', 'b', 'i', 's', 'del', 'mark']
const STRUCTURE_TAGS = ['ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']
const CODE_TAGS = ['blockquote', 'pre', 'code', 'a']
const MEDIA_TAGS = ['img', 'video', 'audio', 'source']
const TABLE_TAGS = ['table', 'thead', 'tbody', 'tr', 'th', 'td']
const URI_REGEXP =
  /^(?:(?:(?:f|ht)tps?|mailto|tel|sms):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i

export const STRICT_CONFIG: SanitizerConfig = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
}

export const BASIC_CONFIG: SanitizerConfig = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'b', 'i'],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
}

export const RICH_TEXT_CONFIG: SanitizerConfig = {
  ALLOWED_TAGS: [...TEXT_TAGS, ...FORMAT_TAGS, ...STRUCTURE_TAGS, ...CODE_TAGS],
  ALLOWED_ATTR: ['href', 'title', 'class'],
  ALLOWED_URI_REGEXP: URI_REGEXP,
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
}

export const FULL_CONFIG: SanitizerConfig = {
  ALLOWED_TAGS: [
    ...TEXT_TAGS,
    ...FORMAT_TAGS,
    ...STRUCTURE_TAGS,
    ...CODE_TAGS,
    ...MEDIA_TAGS,
    ...TABLE_TAGS,
  ],
  ALLOWED_ATTR: [
    'href',
    'title',
    'class',
    'src',
    'alt',
    'width',
    'height',
    'controls',
    'autoplay',
    'loop',
    'muted',
    'colspan',
    'rowspan',
  ],
  ALLOWED_URI_REGEXP: URI_REGEXP,
  KEEP_CONTENT: true,
}

export function getConfigForLevel(level: SanitizationLevel): SanitizerConfig {
  const configs = {
    strict: STRICT_CONFIG,
    basic: BASIC_CONFIG,
    rich: RICH_TEXT_CONFIG,
    full: FULL_CONFIG,
  } satisfies Record<SanitizationLevel, SanitizerConfig>

  return configs[level]
}
