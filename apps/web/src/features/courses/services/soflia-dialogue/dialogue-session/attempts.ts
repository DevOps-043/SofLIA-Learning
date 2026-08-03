import { attemptsInWindow, decideWindowedAttempt } from '../../attempt-cooldown'
import { MAX_DIALOGUE_ACTIVITY_ATTEMPTS } from '../../attempt-limits'

export { MAX_DIALOGUE_ACTIVITY_ATTEMPTS }

/**
 * Intentos de una actividad de diálogo dentro de la ventana de enfriamiento.
 *
 * Solo consumen cupo las sesiones que llegaron a un estado terminal y que empezaron
 * dentro de la ventana: al agotarlos, el alumno recupera un intento en cuanto la sesión
 * más antigua sale de ella. Ya no existe el bloqueo permanente.
 */
export type DialogueAttemptDecision =
  | {
      kind: 'can_create'
      attemptNumber: number
    }
  | {
      kind: 'limit_reached'
      /** ISO UTC en que se recupera un intento. */
      retryAfter: string
    }

export function resolveDialogueAttempt(
  terminalSessionStarts: Array<string | null>,
  windowStartUtc: string,
  maxAttempts = MAX_DIALOGUE_ACTIVITY_ATTEMPTS,
): DialogueAttemptDecision {
  const windowed = attemptsInWindow(terminalSessionStarts, windowStartUtc)
  const decision = decideWindowedAttempt(windowed, maxAttempts)

  if (decision.isLimitReached && decision.retryAfterUtc) {
    return { kind: 'limit_reached', retryAfter: decision.retryAfterUtc }
  }

  return { kind: 'can_create', attemptNumber: decision.attemptNumber }
}
