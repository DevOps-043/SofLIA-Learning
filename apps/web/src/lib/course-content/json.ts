import {
  JSON_LIKE_FIELD_PATTERN,
  JSON_LIKE_PATTERN,
  MAX_PARSE_DEPTH,
  PRIORITIZED_FIELD_KEYS,
} from './constants'
import { hasMeaningfulStringContent } from './html'

export function repairJsonLikeString(value: string): string {
  let result = ''
  let inString = false
  let escaped = false

  for (const char of value) {
    if (escaped) {
      result += char
      escaped = false
      continue
    }
    if (char === '\\') {
      result += char
      escaped = true
      continue
    }
    if (char === '"') {
      result += char
      inString = !inString
      continue
    }
    if (inString && char === '\n') {
      result += '\\n'
      continue
    }
    if (inString && char === '\r') {
      result += '\\r'
      continue
    }
    if (inString && char === '\t') {
      result += '\\t'
      continue
    }
    result += char
  }

  return result
}

export function extractJsonLikeStringSegments(value: string): string[] {
  const trimmed = value.trim()
  if (!trimmed.startsWith('{')) return []

  const prioritizedKeys = new Set(PRIORITIZED_FIELD_KEYS)
  const matches = Array.from(trimmed.matchAll(JSON_LIKE_FIELD_PATTERN))
    .filter((match) => prioritizedKeys.has(match[1]))

  return matches.flatMap((match) => {
    const decoded = decodeJsonLikeStringValue(match[2]).trim()
    return hasMeaningfulStringContent(decoded) ? [decoded] : []
  })
}

export function deepParseJsonValue(value: unknown): unknown {
  let current = value

  for (let depth = 0; depth < MAX_PARSE_DEPTH; depth += 1) {
    if (typeof current !== 'string') break
    const parsed = tryParseJson(current)
    if (parsed === current) break
    current = parsed
  }

  return current
}

function decodeJsonLikeStringValue(value: string): string {
  return value.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t').replace(/\\\\/g, '\\')
}

function tryParseJson(value: string): unknown {
  const trimmed = value.trim()
  if (!trimmed || !JSON_LIKE_PATTERN.test(trimmed)) return value

  try {
    return JSON.parse(trimmed)
  } catch {
    try {
      return JSON.parse(repairJsonLikeString(trimmed))
    } catch {
      return value
    }
  }
}
