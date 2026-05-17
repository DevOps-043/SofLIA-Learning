import {
  parsePlannerDateString,
  parsePlannerTimeString,
} from '../lesson-distribution.service'
import { DAY_NAMES } from './plan-parser.constants'
import { normalizeComparableText } from './plan-parser-text.utils'

export function parseDateFromLine(
  line: string,
  contextDate?: Date,
): { dateStr: string; dayName: string } | null {
  const normalized = normalizeComparableText(line)
  if (normalized.startsWith('semana')) {
    return null
  }

  const parsed = parsePlannerDateString(normalized, contextDate)
  return parsed ? { dateStr: buildIsoDate(parsed), dayName: DAY_NAMES[parsed.getDay()] } : null
}

export function parseTimeRangeFromLine(line: string): { startTime: string; endTime: string } | null {
  const normalized = normalizeComparableText(line)
  const rangeMatch = normalized.match(
    /(?:a\s+las\s+|de\s+)?(\d{1,2}(?::\d{2})?\s*(?:a\.?\s*m\.?|p\.?\s*m\.?|am|pm)?)\s*(?:-|a|hasta)\s*(\d{1,2}(?::\d{2})?\s*(?:a\.?\s*m\.?|p\.?\s*m\.?|am|pm)?)/i,
  )

  if (!rangeMatch) {
    return null
  }

  const start = parsePlannerTimeString(rangeMatch[1])
  const end = parsePlannerTimeString(rangeMatch[2])

  if (!start || !end) {
    return null
  }

  return {
    startTime: `${String(start.hours).padStart(2, '0')}:${String(start.minutes).padStart(2, '0')}`,
    endTime: `${String(end.hours).padStart(2, '0')}:${String(end.minutes).padStart(2, '0')}`,
  }
}

export function stripTimeRangeFromLine(line: string): string {
  const timeRegex = /(?:(?:a\s+las\s+|de\s+)?(\d{1,2}(?::\d{2})?\s*(?:a\.?\s*m\.?|p\.?\s*m\.?|am|pm)?)\s*(?:-|a|hasta)+\s*(\d{1,2}(?::\d{2})?\s*(?:a\.?\s*m\.?|p\.?\s*m\.?|am|pm)?))/i
  const match = line.match(timeRegex)

  if (!match) {
    return line
  }

  const stripped = line.replace(match[0], '').replace(/^[:\-\s]+/, '').trim()
  return stripped ? `- ${stripped}` : ''
}

function buildIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
