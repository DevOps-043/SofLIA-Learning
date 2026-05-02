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
  private maxEvents = 5000
  private maxDuration = 0
  private initialSnapshot: eventWithTime | null = null
  private rrwebAvailable = false
  private sessionStartTime: number | null = null
  private maxDurationTimeoutId: ReturnType<typeof setTimeout> | null = null

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

  private async attachRrwebListeners(): Promise<void> {
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
  }

  private scheduleMaxDurationStop(): void {
    if (this.maxDuration <= 0) {
      return
    }

    if (this.maxDurationTimeoutId) {
      clearTimeout(this.maxDurationTimeoutId)
    }
    this.maxDurationTimeoutId = setTimeout(() => {
      this.maxDurationTimeoutId = null
      if (!this.isRecording || this.isPausedState) {
        return
      }
      this.stopRecording?.()
      this.isRecording = false
    }, this.maxDuration)
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

    this.maxDuration = maxDuration ?? 0

    setupMutationRecordErrorHandler()

    this.events = []
    this.initialSnapshot = null
    this.isRecording = true
    this.isPausedState = false
    this.sessionStartTime = Date.now()

    try {
      await this.attachRrwebListeners()
      this.scheduleMaxDurationStop()
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
    this.isPausedState = false

    if (this.maxDurationTimeoutId) {
      clearTimeout(this.maxDurationTimeoutId)
      this.maxDurationTimeoutId = null
    }

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

  /**
   * Desengancha los listeners de rrweb para liberar CPU/memoria (típicamente
   * cuando la pestaña queda oculta). Preserva el buffer de eventos y el
   * snapshot inicial para que `resume()` continúe la misma sesión.
   */
  pause(): void {
    if (!this.isRecording || this.isPausedState) {
      return
    }

    this.isPausedState = true
    this.stopRecording?.()
    this.stopRecording = null

    if (this.maxDurationTimeoutId) {
      clearTimeout(this.maxDurationTimeoutId)
      this.maxDurationTimeoutId = null
    }
  }

  /**
   * Re-adjunta los listeners de rrweb sobre el buffer existente y reprograma
   * el corte por duración máxima. Si el re-attach falla, deja la sesión en un
   * estado consistente (no recording, no paused).
   */
  async resume(): Promise<void> {
    if (!this.isRecording || !this.isPausedState) {
      return
    }

    try {
      await this.attachRrwebListeners()
      this.isPausedState = false
      this.scheduleMaxDurationStop()
    } catch (error) {
      console.error('[SessionRecorder] Error reanudando grabacion:', error)
      this.isRecording = false
      this.isPausedState = false
      this.stopRecording = null
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

  getBufferedEventCount(): number {
    return this.events.length
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
