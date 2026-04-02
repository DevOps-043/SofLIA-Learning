import type { eventWithTime } from '@rrweb/types'
import { loadRrweb } from './rrweb-loader'
import { compressSession } from './session-compressor'
import { buildEnrichedMetadata } from './session-recorder.metadata'
import { buildSessionRecorderRecordOptions } from './session-recorder.options'
import type {
  EnrichedMetadata,
  RecordingSession,
  SessionRecorderInstance,
} from './session-recorder.types'
import {
  buildRecordingSession,
  createServerSessionRecorderMock,
  exportSessionBase64,
  getSessionSize,
  getSessionSizeFormatted,
  setupMutationRecordErrorHandler,
} from './session-recorder.utils'

export class SessionRecorder {
  private static instance: SessionRecorder
  private events: eventWithTime[] = []
  private stopRecording: (() => void) | null = null
  private isRecording = false
  private isPausedState = false
  private maxEvents = 20000
  private maxDuration = 60000
  private initialSnapshot: eventWithTime | null = null
  private rrwebAvailable = false
  private sessionStartTime: number | null = null

  private constructor() {}

  static getInstance(): SessionRecorder {
    if (!SessionRecorder.instance) {
      SessionRecorder.instance = new SessionRecorder()
    }

    return SessionRecorder.instance
  }

  private async checkRrwebAvailability(): Promise<boolean> {
    if (typeof window === 'undefined') {
      return false
    }

    try {
      const rrweb = await loadRrweb()
      const isAvailable = rrweb !== null && typeof rrweb?.record === 'function'
      this.rrwebAvailable = isAvailable
      return isAvailable
    } catch (error) {
      console.error('[SessionRecorder] Error verificando disponibilidad de rrweb:', error)
      this.rrwebAvailable = false
      return false
    }
  }

  async startRecording(maxDuration?: number): Promise<void> {
    if (typeof window === 'undefined') {
      console.warn('[SessionRecorder] Solo funciona en el cliente')
      return
    }

    if (this.isRecording) {
      return
    }

    const isAvailable = await this.checkRrwebAvailability()
    if (!isAvailable) {
      console.warn('[SessionRecorder] rrweb no esta disponible temporalmente')
      return
    }

    if (maxDuration) {
      this.maxDuration = maxDuration
    }

    setupMutationRecordErrorHandler()

    this.events = []
    this.initialSnapshot = null
    this.isRecording = true
    this.isPausedState = false
    this.sessionStartTime = Date.now()

    try {
      const rrweb = await loadRrweb()

      if (!rrweb || typeof rrweb.record !== 'function') {
        throw new Error('rrweb.record no esta disponible')
      }

      const recordOptions = buildSessionRecorderRecordOptions({
        isDev: process.env.NODE_ENV === 'development',
        getEvents: () => this.events,
        maxEvents: this.maxEvents,
        getInitialSnapshot: () => this.initialSnapshot,
        setEvents: (events) => {
          this.events = events
        },
        setInitialSnapshot: (snapshot) => {
          this.initialSnapshot = snapshot
        },
      })

      const stopRecording = rrweb.record(recordOptions)

      if (typeof stopRecording !== 'function') {
        throw new Error('rrweb.record no retorno una funcion de detencion')
      }

      this.stopRecording = stopRecording

      setTimeout(() => {
        if (!this.isRecording) {
          return
        }

        this.stopRecording?.()
        this.isRecording = false
      }, this.maxDuration)
    } catch (error) {
      console.error('[SessionRecorder] Error iniciando grabacion:', error)
      this.isRecording = false
      this.stopRecording = null
      this.rrwebAvailable = false

      setTimeout(() => {
        this.checkRrwebAvailability().catch(() => {
          // no-op
        })
      }, 5000)
    }
  }

  captureSnapshot(): RecordingSession | null {
    if (!this.isRecording) {
      console.warn('[SessionRecorder] No hay grabacion activa para capturar')
      return null
    }

    const session = buildRecordingSession(this.events, this.initialSnapshot)
    if (!session) {
      console.error('[SessionRecorder] No hay eventos para capturar')
      return null
    }

    return session
  }

  stop(): RecordingSession | null {
    if (!this.isRecording) {
      return null
    }

    this.stopRecording?.()
    this.isRecording = false

    const session = buildRecordingSession(this.events, this.initialSnapshot)
    if (!session) {
      console.error('[SessionRecorder] No se capturaron eventos')
      return null
    }

    this.events = []
    this.initialSnapshot = null
    this.stopRecording = null

    return session
  }

  getCurrentSession(): RecordingSession | null {
    if (!this.isRecording || this.events.length === 0) {
      return null
    }

    return buildRecordingSession(this.events, this.initialSnapshot)
  }

  isActive(): boolean {
    return this.isRecording
  }

  isPaused(): boolean {
    return this.isPausedState
  }

  pause(): void {
    if (this.isRecording && !this.isPausedState) {
      this.isPausedState = true
    }
  }

  resume(): void {
    if (this.isRecording && this.isPausedState) {
      this.isPausedState = false
    }
  }

  isRrwebAvailable(): boolean {
    return this.rrwebAvailable
  }

  exportSession(session: RecordingSession): string {
    return JSON.stringify(session)
  }

  exportSessionBase64(session: RecordingSession): string {
    return exportSessionBase64(session)
  }

  getSessionSize(session: RecordingSession): number {
    return getSessionSize(session)
  }

  getSessionSizeFormatted(session: RecordingSession): string {
    return getSessionSizeFormatted(session)
  }

  async exportSessionCompressed(session: RecordingSession): Promise<string> {
    try {
      const result = await compressSession(session)
      return result.compressed
    } catch (error) {
      console.error('[SessionRecorder] Error en compresion, usando fallback:', error)
      return exportSessionBase64(session)
    }
  }

  getSessionStartTime(): number | null {
    return this.sessionStartTime
  }

  getEnrichedMetadata(session?: RecordingSession | null): EnrichedMetadata {
    return buildEnrichedMetadata({
      session: session || this.getCurrentSession(),
      sessionStartTime: this.sessionStartTime,
    })
  }
}

export function getSessionRecorderInstance(): SessionRecorderInstance {
  if (typeof window === 'undefined') {
    return createServerSessionRecorderMock()
  }

  return SessionRecorder.getInstance()
}
