const DEFAULT_MAX_STRING_LENGTH = 4000
const MAX_RECURSION_DEPTH = 6

const MARKUP_PATTERNS = [
  /<!--[\s\S]*?-->/g,
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
  /<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi,
]

const HIDDEN_STYLE_PATTERNS = [
  /display\s*:\s*none/gi,
  /visibility\s*:\s*hidden/gi,
  /opacity\s*:\s*0(?:[;,\s)]|$)/gi,
  /aria-hidden\s*=\s*["']?true["']?/gi,
  /hidden\s*=\s*["']?hidden["']?/gi,
]

function replaceUnsafeControlChars(input: string, replacement = ' ') {
  return Array.from(input)
    .map((char) => {
      const code = char.charCodeAt(0)
      const isUnsafe =
        code <= 0x08 ||
        code === 0x0b ||
        code === 0x0c ||
        (code >= 0x0e && code <= 0x1f) ||
        code === 0x7f

      return isUnsafe ? replacement : char
    })
    .join('')
}

function stripMarkupArtifacts(input: string) {
  return MARKUP_PATTERNS.reduce(
    (current, pattern) => current.replace(pattern, ' '),
    input,
  )
}

function stripHiddenStyleHints(input: string) {
  return HIDDEN_STYLE_PATTERNS.reduce(
    (current, pattern) => current.replace(pattern, ' '),
    input,
  )
}

export function sanitizeUntrustedString(
  input: string,
  maxLength = DEFAULT_MAX_STRING_LENGTH,
) {
  const withoutMarkup = stripMarkupArtifacts(input)
  const withoutHiddenHints = stripHiddenStyleHints(withoutMarkup)
  const normalized = replaceUnsafeControlChars(withoutHiddenHints)
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()

  if (normalized.length <= maxLength) {
    return normalized
  }

  return `${normalized.slice(0, maxLength)}...[truncated]`
}

function sanitizeUnknownInternal(
  value: unknown,
  depth: number,
  maxStringLength: number,
): unknown {
  if (depth > MAX_RECURSION_DEPTH) {
    return undefined
  }

  if (typeof value === 'string') {
    return sanitizeUntrustedString(value, maxStringLength)
  }

  if (
    value === null ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeUnknownInternal(item, depth + 1, maxStringLength))
      .filter((item) => item !== undefined)
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([key, currentValue]) => [
        key,
        sanitizeUnknownInternal(currentValue, depth + 1, maxStringLength),
      ] as const)
      .filter(([, currentValue]) => currentValue !== undefined)

    return Object.fromEntries(entries)
  }

  return undefined
}

export function sanitizeContextPayload<T>(
  payload: T,
  maxStringLength = DEFAULT_MAX_STRING_LENGTH,
): T {
  return sanitizeUnknownInternal(payload, 0, maxStringLength) as T
}

export function buildSanitizedContextExcerpt(
  payload: unknown,
  maxLength = DEFAULT_MAX_STRING_LENGTH,
) {
  const sanitized = sanitizeContextPayload(payload, Math.min(maxLength, 2000))

  try {
    return sanitizeUntrustedString(JSON.stringify(sanitized), maxLength)
  } catch {
    return ''
  }
}
