import {
  attemptsInWindow,
  retryAvailableAt,
} from '@/features/courses/services/attempt-cooldown';
import { MAX_ACTIVITY_COMPLETION_ATTEMPTS } from '@/features/courses/services/attempt-limits';

export { MAX_ACTIVITY_COMPLETION_ATTEMPTS };

/** Cota inferior para reutilizar el filtro+orden de `attemptsInWindow` sin descartar nada. */
const EPOCH_ISO = new Date(0).toISOString();

export interface ActivityCompletionAttemptRecord {
  completion_id: string;
  status?: string | null;
  started_at?: string | null;
}

export type ActivityCompletionAttemptDecision =
  | {
      kind: 'already_completed';
      completionId: string;
    }
  | {
      kind: 'limit_reached';
      /** ISO UTC en que se recupera un intento. */
      retryAfter: string;
    }
  | {
      kind: 'can_create';
      attemptNumber: number;
    };

export interface ResolveActivityCompletionInput {
  /**
   * TODAS las filas del alumno para esa actividad. Se usan solo para la idempotencia:
   * una actividad ya completada debe devolver siempre el mismo `completion_id`, sin
   * importar hace cuánto se completó.
   */
  allAttempts: ActivityCompletionAttemptRecord[];
  /**
   * Filas que consumen cupo: las hechas dentro de la ventana de enfriamiento y
   * posteriores al último desbloqueo administrativo.
   */
  attemptsInWindow: ActivityCompletionAttemptRecord[];
  maxAttempts?: number;
}

/**
 * Decide si el alumno puede iniciar otro intento de una actividad guiada de LIA.
 *
 * El tope no es permanente: se cuenta dentro de una ventana deslizante, de modo que al
 * agotarlo el alumno recupera cupo en cuanto el intento más antiguo sale de ella.
 */
export function resolveActivityCompletionAttempt(
  input: ResolveActivityCompletionInput
): ActivityCompletionAttemptDecision {
  const alreadyCompleted = input.allAttempts.find(
    (completion) => completion.status === 'completed'
  );

  if (alreadyCompleted) {
    return {
      kind: 'already_completed',
      completionId: alreadyCompleted.completion_id,
    };
  }

  // El cupo se mide por FILAS: un intento sin `started_at` igualmente se realizó.
  const used = input.attemptsInWindow.length;
  const maxAttempts = input.maxAttempts ?? MAX_ACTIVITY_COMPLETION_ATTEMPTS;

  if (used < maxAttempts) {
    return { kind: 'can_create', attemptNumber: used + 1 };
  }

  // El intento más antiguo de la ventana es el que primero devuelve cupo. Si ninguna
  // fila trae marca de tiempo, se anuncia el peor caso: una ventana completa desde ya.
  const oldestInWindow = attemptsInWindow(
    input.attemptsInWindow.map((completion) => completion.started_at ?? null),
    EPOCH_ISO
  )[0];

  return {
    kind: 'limit_reached',
    retryAfter: retryAvailableAt(oldestInWindow ?? new Date().toISOString()),
  };
}
