export const VIDEO_COMPLETION_PERCENT = 95;

/**
 * Colchón fijo (segundos) que siempre se permite avanzar al máximo alcanzado,
 * independientemente del tiempo transcurrido. Absorbe el jitter de los timers
 * del navegador y cubre el primer reporte de una sesión (sin `elapsedSeconds`).
 */
export const MAX_FORWARD_PROGRESS_JUMP_SECONDS = 8;

/**
 * Tasa de reproducción máxima que el servidor considera "de confianza" para
 * calcular el avance permitido. Los reproductores reales llegan hasta ~2x; un
 * `playbackRate` falsificado más alto NO desbloquea saltos arbitrarios.
 */
export const MAX_TRUSTED_PLAYBACK_RATE = 2.5;

/**
 * Tolerancia sobre el avance teórico (`elapsed * rate`) para absorber desfases
 * de reloj entre el cliente y el servidor y el redondeo a segundos enteros.
 */
export const PLAYBACK_ELAPSED_TOLERANCE = 1.25;

/**
 * Tope de tiempo real (segundos) que un único reporte puede representar. Evita
 * que una sola petición tras un periodo largo de inactividad desbloquee el
 * video completo de golpe; obliga a que el avance grande llegue en varios
 * reportes espaciados en el tiempo (anti-cheat de "saltar al final").
 */
export const MAX_TRUSTED_ELAPSED_SECONDS = 30;

interface NormalizeVideoProgressInput {
  checkpoint: number;
  currentMaxReached: number;
  incomingMaxReached: number;
  totalDuration: number;
  /**
   * Tiempo real transcurrido (segundos) desde el último reporte de esta lección.
   * Cuando se omite, el avance permitido se limita al colchón fijo.
   */
  elapsedSeconds?: number;
  /** Velocidad de reproducción reportada por el cliente. */
  playbackRate?: number;
  /**
   * El navegador emitió `ended`: la reproducción llegó al final natural del
   * video. Es prueba autoritativa de completitud (el guard de avance impide
   * llegar al final saltando), por lo que se acepta el máximo reportado sin
   * aplicar el límite anti-salto, garantizando que un video visto completo
   * cruce el umbral de completitud independientemente de la velocidad.
   */
  reachedEnd?: boolean;
}

export interface NormalizedVideoProgress {
  safeCheckpoint: number;
  safeMaxReached: number;
  videoProgressPercentage: number;
}

export function clampVideoTime(value: number, totalDuration: number): number {
  const safeValue = Number.isFinite(value) ? value : 0;
  const safeDuration = totalDuration > 0 ? totalDuration : Number.POSITIVE_INFINITY;

  return Math.max(0, Math.min(Math.floor(safeValue), safeDuration));
}

/**
 * Calcula cuánto puede crecer el "máximo alcanzado" en un único reporte.
 *
 * El avance legítimo de un video está acotado por el tiempo real transcurrido
 * multiplicado por la velocidad de reproducción: no se puede ver más video del
 * que el reloj permite. Sobre esa cota se aplica una tolerancia y un colchón
 * fijo. Tanto el `elapsed` como el `rate` se acotan para que valores
 * falsificados no desbloqueen saltos arbitrarios.
 */
export function computeAllowedForwardJumpSeconds(
  elapsedSeconds?: number,
  playbackRate?: number,
): number {
  const trustedElapsed =
    Number.isFinite(elapsedSeconds) && (elapsedSeconds as number) > 0
      ? Math.min(elapsedSeconds as number, MAX_TRUSTED_ELAPSED_SECONDS)
      : 0;
  const trustedRate =
    Number.isFinite(playbackRate) && (playbackRate as number) > 0
      ? Math.min(playbackRate as number, MAX_TRUSTED_PLAYBACK_RATE)
      : 1;

  return (
    MAX_FORWARD_PROGRESS_JUMP_SECONDS +
    trustedElapsed * trustedRate * PLAYBACK_ELAPSED_TOLERANCE
  );
}

export function normalizeVideoProgress({
  checkpoint,
  currentMaxReached,
  incomingMaxReached,
  totalDuration,
  elapsedSeconds,
  playbackRate,
  reachedEnd,
}: NormalizeVideoProgressInput): NormalizedVideoProgress {
  const safeCurrentMax = clampVideoTime(currentMaxReached, totalDuration);
  const safeIncomingMax = clampVideoTime(incomingMaxReached, totalDuration);
  // En el evento terminal `ended` se confía en el máximo reportado (ya acotado
  // a la duración por `clampVideoTime`); en cualquier otro reporte el avance se
  // limita por tiempo real transcurrido y velocidad. El resultado se trunca a
  // segundos enteros y nunca decrece (invariante monotónico).
  const maxAllowedByPreviousProgress = reachedEnd
    ? safeIncomingMax
    : Math.floor(
        safeCurrentMax + computeAllowedForwardJumpSeconds(elapsedSeconds, playbackRate),
      );
  const safeMaxReached = Math.max(
    safeCurrentMax,
    Math.min(safeIncomingMax, maxAllowedByPreviousProgress),
  );
  const safeCheckpoint = Math.min(
    clampVideoTime(checkpoint, totalDuration),
    safeMaxReached,
  );

  return {
    safeCheckpoint,
    safeMaxReached,
    videoProgressPercentage: totalDuration > 0
      ? Math.min(100, Math.round((safeMaxReached / totalDuration) * 100))
      : 0,
  };
}

export function buildSafeResumeCheckpoint({
  checkpoint,
  completionPercentage,
  isCompleted,
  maxReached,
}: {
  checkpoint: number;
  completionPercentage: number;
  isCompleted: boolean;
  maxReached: number;
}): number {
  const safeCheckpoint = Math.max(0, Math.floor(checkpoint || 0));
  const safeMaxReached = Math.max(0, Math.floor(maxReached || 0));

  if (isCompleted || completionPercentage >= VIDEO_COMPLETION_PERCENT) {
    return safeCheckpoint;
  }

  return Math.min(safeCheckpoint, safeMaxReached);
}
