import { getContextMarkers, getSessionSummary } from './context-markers'
import { getRecentErrors, getErrorSummary } from './error-interceptor'
import { sanitizeRecordedUrl } from './session-recorder-privacy'
import { getSessionSizeFormatted } from './session-recorder.utils'
import type { EnrichedMetadata, RecordingSession } from './session-recorder.types'

export function buildEnrichedMetadata(params: {
  session: RecordingSession | null
  sessionStartTime: number | null
}): EnrichedMetadata {
  const now = Date.now()
  const connection =
    typeof navigator !== 'undefined' && 'connection' in navigator
      ? (navigator as Navigator & { connection?: { effectiveType?: string } }).connection
          ?.effectiveType
      : undefined
  const memory =
    typeof navigator !== 'undefined' && 'deviceMemory' in navigator
      ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory
      : undefined
  const errors = getRecentErrors()
  const errorSummary = getErrorSummary()
  const contextMarkers = getContextMarkers()
  const sessionSummary = getSessionSummary()

  return {
    viewport:
      typeof window !== 'undefined'
        ? { width: window.innerWidth, height: window.innerHeight }
        : { width: 0, height: 0 },
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
    language: typeof navigator !== 'undefined' ? navigator.language : 'unknown',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    connection,
    memory,
    currentUrl:
      typeof window !== 'undefined' ? sanitizeRecordedUrl(window.location.href) : 'unknown',
    sessionDuration: params.sessionStartTime ? now - params.sessionStartTime : 0,
    errors,
    errorSummary,
    contextMarkers,
    sessionSummary,
    recordingInfo: {
      eventCount: params.session?.events.length || 0,
      size: params.session ? getSessionSizeFormatted(params.session) : '0 B',
      compressed: false,
    },
  }
}
