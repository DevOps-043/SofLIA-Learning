import { ALLOWED_CSS_CLASSES } from './dom-purify.constants'
import type { SanitizerConfig } from './html-sanitizer.types'

const DEFAULT_ALLOWED_URI_REGEXP =
  /^(?:(?:(?:f|ht)tps?|mailto|tel|sms):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i

const ATTRIBUTE_PATTERN =
  /([a-zA-Z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g

function decodeCommonAttributeEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function escapeAttributeValue(value: string): string {
  return decodeCommonAttributeEntities(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function sanitizeUrlAttribute(
  value: string,
  allowedUriRegexp: RegExp,
): string | null {
  const normalizedValue = value.trim().replace(/[\u0000-\u001F\u007F\s]+/g, '')
  if (!normalizedValue || !allowedUriRegexp.test(normalizedValue)) {
    return null
  }

  return normalizedValue
}

function sanitizeClassAttribute(value: string): string | null {
  const safeClasses = value
    .split(/\s+/)
    .filter(Boolean)
    .filter((className) =>
      ALLOWED_CSS_CLASSES.some((pattern) => pattern.test(className)),
    )

  return safeClasses.length > 0 ? safeClasses.join(' ') : null
}

function sanitizeRelAttribute(value: string): string | null {
  const allowedRelValues = new Set(['noopener', 'noreferrer', 'nofollow', 'ugc'])
  const safeRelValues = value
    .toLowerCase()
    .split(/\s+/)
    .filter((item) => allowedRelValues.has(item))

  return safeRelValues.length > 0 ? Array.from(new Set(safeRelValues)).join(' ') : null
}

function sanitizeStyleAttribute(value: string): string | null {
  const safeDeclarations = value
    .split(';')
    .map((declaration) => declaration.trim())
    .map((declaration) => {
      const [rawProperty, ...rawValueParts] = declaration.split(':')
      const property = rawProperty?.trim().toLowerCase()
      const propertyValue = rawValueParts.join(':').trim().toLowerCase()

      if (
        property === 'text-align' &&
        /^(left|center|right|justify)$/.test(propertyValue)
      ) {
        return `text-align: ${propertyValue}`
      }

      return null
    })
    .filter((declaration): declaration is string => Boolean(declaration))

  return safeDeclarations.length > 0 ? `${safeDeclarations.join('; ')};` : null
}

function sanitizeAllowedAttribute(
  attrName: string,
  attrValue: string,
  allowedUriRegexp: RegExp,
): string | null {
  const normalizedName = attrName.toLowerCase()

  if (normalizedName.startsWith('on')) {
    return null
  }

  if (normalizedName === 'href' || normalizedName === 'src') {
    return sanitizeUrlAttribute(attrValue, allowedUriRegexp)
  }

  if (normalizedName === 'class') {
    return sanitizeClassAttribute(attrValue)
  }

  if (normalizedName === 'target') {
    return attrValue === '_blank' || attrValue === '_self' ? attrValue : null
  }

  if (normalizedName === 'rel') {
    return sanitizeRelAttribute(attrValue)
  }

  if (normalizedName === 'style') {
    return sanitizeStyleAttribute(attrValue)
  }

  if (normalizedName === 'title' || normalizedName === 'alt') {
    return attrValue.replace(/<[^>]*>/g, '').trim()
  }

  if (normalizedName === 'width' || normalizedName === 'height') {
    return /^\d{1,4}$/.test(attrValue.trim()) ? attrValue.trim() : null
  }

  if (['autoplay', 'controls', 'loop', 'muted'].includes(normalizedName)) {
    return normalizedName
  }

  return attrValue.trim()
}

function sanitizeTagAttributes(
  rawAttributes: string,
  allowedAttributes: Set<string>,
  allowedUriRegexp: RegExp,
): string {
  const attributes: string[] = []

  for (const match of rawAttributes.matchAll(ATTRIBUTE_PATTERN)) {
    const attrName = match[1].toLowerCase()
    const attrValue = match[2] ?? match[3] ?? match[4] ?? ''

    if (!allowedAttributes.has(attrName)) {
      continue
    }

    const safeValue = sanitizeAllowedAttribute(
      attrName,
      attrValue,
      allowedUriRegexp,
    )

    if (!safeValue) {
      continue
    }

    attributes.push(`${attrName}="${escapeAttributeValue(safeValue)}"`)
  }

  return attributes.length > 0 ? ` ${attributes.join(' ')}` : ''
}

export function basicServerSanitize(
  html: string,
  configOrAllowedTags: SanitizerConfig | string[],
): string {
  const allowedTags = Array.isArray(configOrAllowedTags)
    ? configOrAllowedTags
    : configOrAllowedTags.ALLOWED_TAGS || []
  const allowedAttributes = new Set(
    Array.isArray(configOrAllowedTags)
      ? []
      : ((configOrAllowedTags.ALLOWED_ATTR as string[] | undefined) || []).map(
          (attr) => attr.toLowerCase(),
        ),
  )
  const allowedUriRegexp = Array.isArray(configOrAllowedTags)
    ? DEFAULT_ALLOWED_URI_REGEXP
    : (configOrAllowedTags.ALLOWED_URI_REGEXP as RegExp | undefined) ||
      DEFAULT_ALLOWED_URI_REGEXP

  let sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')

  if (!allowedTags.length) {
    return sanitized.replace(/<[^>]*>/g, '')
  }

  const allowedTagsSet = new Set(allowedTags.map((tag) => tag.toLowerCase()))
  sanitized = sanitized.replace(
    /<(\/?)([a-z][a-z0-9]*)\b([^>]*)>/gi,
    (_match, closing, tagName, rawAttributes) => {
      const lowerTag = tagName.toLowerCase()
      if (!allowedTagsSet.has(lowerTag)) {
        return ''
      }

      if (closing) {
        return `</${lowerTag}>`
      }

      return `<${lowerTag}${sanitizeTagAttributes(
        rawAttributes,
        allowedAttributes,
        allowedUriRegexp,
      )}>`
    },
  )

  return sanitized
}
