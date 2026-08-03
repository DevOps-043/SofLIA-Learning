import { buildAttemptLimitMessage, retryAvailableAt } from '../../attempt-cooldown'
import { DialogueRuntimeError } from '../dialogue-runtime.errors'
import { MAX_DIALOGUE_ACTIVITY_ATTEMPTS } from './attempts'

/**
 * Traduce el error del trigger `enforce_soflia_dialogue_session_attempt_limit` a un
 * error de dominio. El texto del trigger incluye el número de intentos, así que el
 * reconocimiento se hace por la parte estable del mensaje: cambiar el tope en la BD
 * no debe convertir un 429 de límite en un 500 genérico.
 *
 * Este camino solo se alcanza en carrera (dos peticiones simultáneas que pasan la
 * pre-validación): la aplicación no conoce aquí la sesión más antigua de la ventana,
 * así que anuncia el peor caso —una ventana completa— en lugar de mentir con un
 * tiempo más corto.
 */
const ATTEMPT_LIMIT_DB_MESSAGE = 'intentos para esta actividad'

export function throwDialogueSessionInsertError(message?: string): never {
  if (message?.includes(ATTEMPT_LIMIT_DB_MESSAGE)) {
    const retryAfter = retryAvailableAt(new Date().toISOString())
    throw new DialogueRuntimeError(
      'DIALOGUE_ATTEMPT_LIMIT_REACHED',
      429,
      buildAttemptLimitMessage(MAX_DIALOGUE_ACTIVITY_ATTEMPTS, retryAfter),
      { retryAfter },
    )
  }

  throw new DialogueRuntimeError(
    'DIALOGUE_PERSISTENCE_FAILED',
    500,
    'No fue posible iniciar la sesion de dialogo',
    { message },
  )
}
