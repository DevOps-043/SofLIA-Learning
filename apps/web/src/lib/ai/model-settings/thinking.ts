/**
 * Nivel de razonamiento interno ("thinking") de los modelos Gemini.
 *
 * Los modelos de la familia gemini-3.x descuentan sus tokens de razonamiento del
 * presupuesto `maxOutputTokens`. Exponer este nivel como configuración permite
 * equilibrar calidad contra costo y latencia por propósito sin tocar código:
 * un evaluador de rúbrica se beneficia de razonamiento alto, mientras que un
 * clasificador de intenciones o una transcripción no lo necesitan.
 *
 * Módulo puro y sin dependencias: lo consumen tanto el servidor (al construir la
 * llamada al proveedor) como el panel de administración en el navegador.
 */

export const AI_THINKING_LEVELS = [
  'default',
  'off',
  'low',
  'medium',
  'high',
  'dynamic',
] as const

export type AiThinkingLevel = (typeof AI_THINKING_LEVELS)[number]

/**
 * Presupuesto de tokens de razonamiento por nivel.
 *
 * `-1` es el valor que la API de Gemini interpreta como "presupuesto dinámico":
 * el modelo decide cuánto razonar según la dificultad de la petición.
 */
const THINKING_BUDGET_BY_LEVEL: Record<Exclude<AiThinkingLevel, 'default'>, number> = {
  dynamic: -1,
  high: 24_576,
  low: 2_048,
  medium: 8_192,
  off: 0,
}

export function isAiThinkingLevel(value: unknown): value is AiThinkingLevel {
  return (
    typeof value === 'string' &&
    (AI_THINKING_LEVELS as readonly string[]).includes(value)
  )
}

/**
 * Traduce el nivel configurado al `thinkingConfig` que espera la API de Gemini.
 *
 * Devuelve `undefined` para el nivel `default`, de modo que la petición se envíe
 * SIN `thinkingConfig` y el proveedor aplique su propio comportamiento por
 * defecto. Es deliberado: no queremos fijar un presupuesto implícito en cada
 * llamada solo por el hecho de tener la configuración disponible.
 */
export function buildThinkingConfig(
  level: AiThinkingLevel,
): { thinkingBudget: number } | undefined {
  if (level === 'default') {
    return undefined
  }

  return { thinkingBudget: THINKING_BUDGET_BY_LEVEL[level] }
}
