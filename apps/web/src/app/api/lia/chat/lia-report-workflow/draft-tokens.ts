import { logger as techDebtLogger } from '@/lib/utils/logger'
import type { BugReportDraftTokenPayload } from './types'
import { extractToken, stripTokenMarkers, BUG_REPORT_DRAFT_REGEX } from './token-markers'

export function extractBugReportDraftToken(content: string): BugReportDraftTokenPayload | null {
  try {
    return extractToken<BugReportDraftTokenPayload>(
      content,
      BUG_REPORT_DRAFT_REGEX,
    )?.payload ?? null
  } catch (error) {
    techDebtLogger.error('Error leyendo el borrador de reporte de SofLIA:', error)
    return null
  }
}

export function stripBugReportTokens(content: string): string {
  return stripTokenMarkers(content)
}
