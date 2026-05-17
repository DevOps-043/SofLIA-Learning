import type { Json } from '@/lib/supabase/types'
import type { BusinessUserAnalyticsInsights } from '../../../types/business-user-analytics.types'

export function extractJsonObject(value: string): string {
  const trimmed = value.trim()
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fencedMatch?.[1]) return fencedMatch[1].trim()

  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')
  return firstBrace >= 0 && lastBrace > firstBrace
    ? trimmed.slice(firstBrace, lastBrace + 1)
    : trimmed
}

export function isInsightsPayload(value: Json): value is Json & BusinessUserAnalyticsInsights {
  return Boolean(
    value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      typeof (value as { summary?: unknown }).summary === 'string',
  )
}

export function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json
}
