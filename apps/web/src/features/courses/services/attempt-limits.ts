/**
 * Topes de intentos del alumno — fuente ÚNICA de verdad en la aplicación.
 *
 * Cada constante tiene un espejo en la base de datos (constraint + trigger) que es la
 * barrera autoritativa bajo concurrencia; la aplicación pre-valida por UX. Si se cambia
 * un número aquí, hay que cambiarlo también en la migración correspondiente:
 *
 *   - quiz .................. `resolveQuizAttempt` (sin trigger; ventana en la app)
 *   - diálogo SofLIA ........ `enforce_soflia_dialogue_session_attempt_limit`
 *   - actividad guiada LIA .. `enforce_lia_activity_completion_attempt_limit`
 *
 * (migraciones 20260803090000 y 20260803110000)
 *
 * Ningún bloqueo es permanente: los tres motores cuentan intentos dentro de una VENTANA
 * DESLIZANTE de `ATTEMPT_COOLDOWN_HOURS`. Al expirar el intento más antiguo de la
 * ventana, el alumno recupera cupo solo. El desbloqueo administrativo
 * (`features/courses/services/attempt-unlocks`) existe para no obligarle a esperar.
 */

/** Intentos de quiz permitidos dentro de la ventana de enfriamiento. */
export const MAX_QUIZ_ATTEMPTS = 3

/** Intentos por actividad de diálogo SofLIA (solo sesiones terminales consumen cupo). */
export const MAX_DIALOGUE_ACTIVITY_ATTEMPTS = 5

/** Intentos por actividad guiada de LIA. */
export const MAX_ACTIVITY_COMPLETION_ATTEMPTS = 5

/**
 * Duración de la ventana deslizante, común a los tres motores.
 *
 * Debe coincidir con el `interval` de los triggers de la migración 20260803110000.
 */
export const ATTEMPT_COOLDOWN_HOURS = 1
