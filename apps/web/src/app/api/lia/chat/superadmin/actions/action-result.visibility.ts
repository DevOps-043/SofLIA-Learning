import type { ActionExecutionResult } from './types'

const SENSITIVE_DETAIL_KEY = /(password|contrase(?:n|ñ)a|secret|token|credential|api[_-]?key)/i

/**
 * Resultado apto para pantalla y voz. Los detalles técnicos existen para
 * trazabilidad interna, pero nunca forman parte de la conversación.
 */
export function buildVisibleActionExecutionMessage(
  result: ActionExecutionResult,
): string {
  return `✅ ${result.summary.trim()}`
}

/** Evita que credenciales o tokens terminen incluso en la auditoría interna. */
export function buildActionAuditDetails(
  details: ActionExecutionResult['details'],
): ActionExecutionResult['details'] {
  if (!details) return undefined

  return Object.fromEntries(
    Object.entries(details).map(([key, value]) => [
      key,
      SENSITIVE_DETAIL_KEY.test(key) ? '[REDACTED]' : value,
    ]),
  )
}
