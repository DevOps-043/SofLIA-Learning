/**
 * Detección de la confirmación humana para ejecutar una acción administrativa.
 *
 * Es deliberadamente MÁS ESTRICTA que la del flujo de reportes: aquí una
 * confirmación dispara una mutación real (banear, crear una organización,
 * emitir una invitación). Por eso:
 *
 *  - Solo cuenta una afirmación explícita e inequívoca.
 *  - Cualquier matiz, condición o pregunta ("sí, pero...", "¿seguro?") NO es
 *    confirmación: fail-closed hacia 'unclear', que aborta la ejecución.
 *  - Una negación explícita se distingue para poder cancelar de forma limpia.
 */

export type ActionConfirmationIntent = 'confirm' | 'cancel' | 'unclear'

/** Afirmaciones inequívocas. Deben ser el inicio del mensaje. */
const CONFIRM_PATTERNS = [
  /^confirmo\b/,
  /^confirmado\b/,
  /^s[ií],?\s+(confirmo|ejec[uú]tal[ao]|adelante|hazlo|procede)\b/,
  /^s[ií]$/,
  /^ejec[uú]tal[ao]\b/,
  /^ejecuta\b/,
  /^h[aá]zlo\b/,
  /^procede\b/,
  /^adelante\b/,
  /^dale\b/,
  /^aprobado\b/,
]

/** Negaciones/cancelaciones explícitas. */
const CANCEL_PATTERNS = [
  /^no\b/,
  /^cancela/,
  /^cancelar\b/,
  /^det[eé]n(te)?\b/,
  /^para\b/,
  /^mejor no\b/,
  /^olv[ií]dalo\b/,
  /^abortar?\b/,
]

/**
 * Marcas de duda o condición: si aparecen, el mensaje NO confirma aunque
 * empiece con una afirmación ("sí, pero antes cámbiale el motivo").
 */
const HEDGE_PATTERNS = [/\bpero\b/, /\baunque\b/, /\bsi\s+.*\bentonces\b/, /\?/]

export function detectActionConfirmationIntent(
  message: string,
): ActionConfirmationIntent {
  const normalized = message.trim().toLowerCase()
  if (!normalized) return 'unclear'

  if (CANCEL_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return 'cancel'
  }

  if (HEDGE_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return 'unclear'
  }

  return CONFIRM_PATTERNS.some((pattern) => pattern.test(normalized))
    ? 'confirm'
    : 'unclear'
}
