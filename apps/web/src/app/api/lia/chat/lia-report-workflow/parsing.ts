import {
  REPORT_PROBLEM_CATEGORIES,
  REPORT_PROBLEM_PRIORITIES,
} from '@/core/reporting/report-problem.contract'

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

export function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

export function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export function parseJsonPayload<T>(rawPayload: string): T {
  try {
    return JSON.parse(rawPayload) as T
  } catch {
    const normalizedPayload = rawPayload
      .replace(/[\n\r]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    return JSON.parse(normalizedPayload) as T
  }
}

export function normalizeBugCategory(value: string | null): string {
  return value &&
    REPORT_PROBLEM_CATEGORIES.includes(value as (typeof REPORT_PROBLEM_CATEGORIES)[number])
    ? value
    : 'bug'
}

export function normalizeBugPriority(value: string | null): string {
  return value &&
    REPORT_PROBLEM_PRIORITIES.includes(value as (typeof REPORT_PROBLEM_PRIORITIES)[number])
    ? value
    : 'media'
}
