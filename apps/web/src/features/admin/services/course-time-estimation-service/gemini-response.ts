import type { GeminiReviewedItem } from './types'

export function parseGeminiResponse(rawContent: string): {
  items?: GeminiReviewedItem[]
} {
  const trimmed = rawContent.trim()
  const sanitized = trimmed.startsWith('```')
    ? trimmed
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/, '')
    : trimmed

  return JSON.parse(sanitized) as { items?: GeminiReviewedItem[] }
}
