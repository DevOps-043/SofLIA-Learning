import type { eventWithTime } from '@rrweb/types'
import type { getErrorSummary, ErrorEvent } from './error-interceptor'
import type { ContextMarker, getSessionSummary } from './context-markers'

export interface RecordingSession {
  events: eventWithTime[]
  startTime: number
  endTime?: number
}

export interface EnrichedMetadata {
  viewport: { width: number; height: number }
  userAgent: string
  platform: string
  language: string
  timezone: string
  connection?: string
  memory?: number
  currentUrl: string
  sessionDuration: number
  errors: ErrorEvent[]
  errorSummary: ReturnType<typeof getErrorSummary>
  contextMarkers: ContextMarker[]
  sessionSummary: ReturnType<typeof getSessionSummary>
  recordingInfo: {
    eventCount: number
    size: string
    compressed: boolean
  }
}

export interface SessionRecorderInstance {
  startRecording(maxDuration?: number): Promise<void>
  stop(): RecordingSession | null
  captureSnapshot(): RecordingSession | null
  getCurrentSession(): RecordingSession | null
  isActive(): boolean
  isPaused(): boolean
  pause(): void
  resume(): void
  isRrwebAvailable(): boolean
  exportSession(session: RecordingSession): string
  exportSessionBase64(session: RecordingSession): string
  exportSessionCompressed(session: RecordingSession): Promise<string>
  getSessionSize(session: RecordingSession): number
  getSessionSizeFormatted(session: RecordingSession): string
  getEnrichedMetadata(session?: RecordingSession | null): EnrichedMetadata
  getSessionStartTime(): number | null
}
