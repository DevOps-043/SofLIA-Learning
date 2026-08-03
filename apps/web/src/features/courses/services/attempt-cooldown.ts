import { ATTEMPT_COOLDOWN_HOURS } from './attempt-limits'
import { resolveCountingWindowStart } from './attempt-unlocks/attempt-unlock.rules'

/**
 * Ventana deslizante de intentos, compartida por quiz, diálogo SofLIA y actividades LIA.
 *
 * Regla única: solo cuentan los intentos hechos dentro de la última
 * `ATTEMPT_COOLDOWN_HOURS`. Cuando se agota el cupo, el alumno recupera un intento en
 * cuanto el más antiguo de la ventana sale de ella — **ningún bloqueo es permanente**.
 *
 * Todo aquí es puro y unit-testeable: los tres motores y el panel forense usan estas
 * mismas funciones para que lo que ve el alumno y lo que ve el auditor no puedan
 * divergir.
 */

export const ATTEMPT_COOLDOWN_MS = ATTEMPT_COOLDOWN_HOURS * 60 * 60 * 1000

/** Inicio de la ventana: los intentos anteriores a este instante ya no cuentan. */
export function cooldownWindowStart(now: Date = new Date()): string {
  return new Date(now.getTime() - ATTEMPT_COOLDOWN_MS).toISOString()
}

/**
 * Inicio efectivo del conteo: el más reciente entre el arranque de la ventana y el
 * último desbloqueo administrativo.
 */
export function attemptWindowStart(now: Date, unlockedFromUtc: string | null): string {
  return resolveCountingWindowStart(cooldownWindowStart(now), unlockedFromUtc)
}

/** Momento en que el intento más antiguo de la ventana devuelve cupo. */
export function retryAvailableAt(oldestAttemptUtc: string): string {
  const ms = Date.parse(oldestAttemptUtc)
  if (Number.isNaN(ms)) return new Date(Date.now() + ATTEMPT_COOLDOWN_MS).toISOString()
  return new Date(ms + ATTEMPT_COOLDOWN_MS).toISOString()
}

/** Marcas de tiempo dentro de la ventana, en orden ascendente (la más antiguo primero). */
export function attemptsInWindow(timestamps: Array<string | null>, windowStartUtc: string): string[] {
  const windowStartMs = Date.parse(windowStartUtc)
  return timestamps
    .filter((iso): iso is string => {
      if (!iso) return false
      const ms = Date.parse(iso)
      return !Number.isNaN(ms) && ms >= windowStartMs
    })
    .sort((a, b) => Date.parse(a) - Date.parse(b))
}

/**
 * Minutos que faltan para recuperar un intento, redondeados hacia arriba y con mínimo 1
 * (decir "en 0 minutos" cuando aún está bloqueado confunde al alumno).
 */
export function minutesUntilRetry(retryAfterUtc: string, now: Date = new Date()): number {
  const remainingMs = Date.parse(retryAfterUtc) - now.getTime()
  if (Number.isNaN(remainingMs) || remainingMs <= 0) return 1
  return Math.max(1, Math.ceil(remainingMs / 60_000))
}

/** Frase de espera para el alumno; sin fecha absoluta, así no depende de la zona horaria. */
export function describeRetryDelay(retryAfterUtc: string, now: Date = new Date()): string {
  const minutes = minutesUntilRetry(retryAfterUtc, now)
  return minutes === 1 ? 'en 1 minuto' : `en ${minutes} minutos`
}

/**
 * Mensaje de límite alcanzado para el alumno.
 *
 * Se expresa como DURACIÓN restante, no como hora absoluta: el servidor no conoce la
 * zona del alumno y "podrás intentarlo a las 14:35 UTC" sería inservible. La marca
 * exacta viaja aparte, en `details.retryAfter`, para quien quiera formatearla.
 */
export function buildAttemptLimitMessage(
  maxAttempts: number,
  retryAfterUtc: string,
  now: Date = new Date(),
): string {
  return `Se alcanzo el limite de ${maxAttempts} intentos para esta actividad. Podras volver a intentarlo ${describeRetryDelay(retryAfterUtc, now)}.`
}

export interface WindowedAttemptDecision {
  /** Intentos consumidos dentro de la ventana. */
  attemptsInWindow: number
  attemptsRemaining: number
  /** Número del intento que se está por crear (1-based). */
  attemptNumber: number
  /** ISO en que se recupera cupo; solo relevante si `isLimitReached`. */
  retryAfterUtc: string | null
  isLimitReached: boolean
}

/**
 * Decisión completa a partir de las marcas de tiempo de los intentos previos ya
 * acotadas a la ventana. Es la aritmética que comparten los tres motores.
 */
export function decideWindowedAttempt(
  timestampsInWindow: string[],
  maxAttempts: number,
): WindowedAttemptDecision {
  const used = timestampsInWindow.length
  const isLimitReached = used >= maxAttempts

  return {
    attemptsInWindow: used,
    attemptsRemaining: Math.max(0, maxAttempts - used),
    attemptNumber: used + 1,
    retryAfterUtc: isLimitReached && timestampsInWindow[0] ? retryAvailableAt(timestampsInWindow[0]) : null,
    isLimitReached,
  }
}
