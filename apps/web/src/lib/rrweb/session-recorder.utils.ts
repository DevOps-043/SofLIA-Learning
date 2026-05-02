import type { eventWithTime } from '@rrweb/types'
import type {
  EnrichedMetadata,
  RecordingSession,
  SessionRecorderInstance,
} from './session-recorder.types'

export function setupMutationRecordErrorHandler() {
  if (typeof window === 'undefined') {
    return
  }

  if (!(window as { __mutationRecordPatchApplied?: boolean }).__mutationRecordPatchApplied) {
    console.warn(
      '[SessionRecorder] El patch de MutationRecord no esta aplicado. Esto puede causar errores.',
    )
  }
}

export function appendRecordedEvent(params: {
  events: eventWithTime[]
  event: eventWithTime
  maxEvents: number
  initialSnapshot: eventWithTime | null
}): {
  events: eventWithTime[]
  initialSnapshot: eventWithTime | null
} {
  const events = params.events
  events.push(params.event)

  const initialSnapshot =
    params.initialSnapshot || (params.event.type === 2 ? params.event : null)

  if (params.maxEvents <= 0) {
    events.length = 0
    return { events, initialSnapshot }
  }

  if (events.length <= params.maxEvents) {
    return { events, initialSnapshot }
  }

  const snapshot = initialSnapshot || events.find((item) => item.type === 2) || null
  const recentEventCount = snapshot ? params.maxEvents - 1 : params.maxEvents
  const recentEvents = recentEventCount > 0 ? events.slice(-recentEventCount) : []

  events.length = 0

  if (snapshot && !recentEvents.some((item) => item.type === 2)) {
    events.push(snapshot)
  }

  events.push(...recentEvents)

  return { events, initialSnapshot: snapshot || initialSnapshot }
}

export function buildRecordingSession(
  events: eventWithTime[],
  initialSnapshot: eventWithTime | null,
): RecordingSession | null {
  if (events.length === 0) {
    return null
  }

  const hasSnapshot = events.some((event) => event.type === 2)
  const sessionEvents = !hasSnapshot && initialSnapshot ? [initialSnapshot, ...events] : [...events]

  return {
    events: sessionEvents,
    startTime: sessionEvents[0]?.timestamp || Date.now(),
    endTime: sessionEvents[sessionEvents.length - 1]?.timestamp || Date.now(),
  }
}

export function exportSessionBase64(session: RecordingSession): string {
  const json = JSON.stringify(session)

  if (typeof window === 'undefined') {
    return ''
  }

  const encoder = new TextEncoder()
  const data = encoder.encode(json)
  const binaryString = Array.from(data, (byte) => String.fromCharCode(byte)).join('')
  return btoa(binaryString)
}

export function getSessionSize(session: RecordingSession): number {
  return new Blob([JSON.stringify(session)]).size
}

export function getSessionSizeFormatted(session: RecordingSession): string {
  const bytes = getSessionSize(session)
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function createServerSessionRecorderMock(): SessionRecorderInstance {
  return {
    startRecording: async () => {},
    stop: () => null,
    captureSnapshot: () => null,
    getCurrentSession: () => null,
    isActive: () => false,
    isPaused: () => false,
    pause: () => {},
    resume: async () => {},
    isRrwebAvailable: () => false,
    exportSession: () => '',
    exportSessionBase64: () => '',
    exportSessionCompressed: async () => '',
    getSessionSize: () => 0,
    getSessionSizeFormatted: () => '0 B',
    getBufferedEventCount: () => 0,
    getEnrichedMetadata: () =>
      ({
        viewport: { width: 0, height: 0 },
        userAgent: 'server',
        platform: 'server',
        language: 'unknown',
        timezone: 'UTC',
        currentUrl: 'server',
        sessionDuration: 0,
        errors: [],
        errorSummary: { totalErrors: 0, byType: {}, recentErrors: [] },
        contextMarkers: [],
        sessionSummary: {
          totalMarkers: 0,
          pageVisits: [],
          modalsOpened: [],
          actionsCount: 0,
          errorsCount: 0,
          timeline: [],
        },
        recordingInfo: { eventCount: 0, size: '0 B', compressed: false },
      }) as EnrichedMetadata,
    getSessionStartTime: () => null,
  }
}
