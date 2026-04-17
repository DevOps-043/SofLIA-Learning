/**
 * Session Recorder usando rrweb
 * Graba sesiones del usuario para debugging y reportes de problemas.
 */

import './mutation-record-patch'

import type {
  EnrichedMetadata,
  RecordingSession,
  SessionRecorderInstance,
} from './session-recorder.types'
import { getSessionRecorderInstance } from './session-recorder.instance'

export type {
  EnrichedMetadata,
  RecordingSession,
  SessionRecorderInstance,
} from './session-recorder.types'
export { SessionRecorder } from './session-recorder.instance'

function getRecorder(): SessionRecorderInstance {
  return getSessionRecorderInstance()
}

export const sessionRecorder = {
  async startRecording(maxDuration?: number): Promise<void> {
    return getRecorder().startRecording(maxDuration)
  },

  stop(): RecordingSession | null {
    return getRecorder().stop()
  },

  captureSnapshot(): RecordingSession | null {
    return getRecorder().captureSnapshot()
  },

  getCurrentSession(): RecordingSession | null {
    return getRecorder().getCurrentSession()
  },

  isActive(): boolean {
    return getRecorder().isActive()
  },

  isPaused(): boolean {
    return getRecorder().isPaused()
  },

  pause(): void {
    return getRecorder().pause()
  },

  resume(): Promise<void> {
    return getRecorder().resume()
  },

  isRrwebAvailable(): boolean {
    return getRecorder().isRrwebAvailable()
  },

  exportSession(session: RecordingSession): string {
    return getRecorder().exportSession(session)
  },

  exportSessionBase64(session: RecordingSession): string {
    return getRecorder().exportSessionBase64(session)
  },

  async exportSessionCompressed(session: RecordingSession): Promise<string> {
    return getRecorder().exportSessionCompressed(session)
  },

  getSessionSize(session: RecordingSession): number {
    return getRecorder().getSessionSize(session)
  },

  getSessionSizeFormatted(session: RecordingSession): string {
    return getRecorder().getSessionSizeFormatted(session)
  },

  getEnrichedMetadata(session?: RecordingSession | null): EnrichedMetadata {
    return getRecorder().getEnrichedMetadata(session)
  },

  getSessionStartTime(): number | null {
    return getRecorder().getSessionStartTime()
  },
}
