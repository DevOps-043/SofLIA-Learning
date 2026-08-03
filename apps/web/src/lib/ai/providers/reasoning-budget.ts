import { AI_MODEL_SETTINGS_LIMITS } from '../model-settings/purposes'
import type { AiThinkingLevel } from '../model-settings/thinking'
import { supportsOpenAiReasoning, type AiProvider } from './provider-registry'

/**
 * Coste del razonamiento interno: en tokens de salida y en tiempo de espera.
 *
 * PROBLEMA QUE RESUELVE: `max_output_tokens` (OpenAI) y `maxOutputTokens`
 * (Gemini 3.x) NO son el tamaño de la respuesta. Son el total de tokens
 * GENERADOS, y en un modelo que razona internamente el razonamiento sale de ese
 * mismo bolsillo ANTES de emitir el primer carácter visible. Un presupuesto
 * calibrado midiendo respuestas —"el JSON de la rúbrica ocupa 4.096 tokens"—
 * deja al modelo sin espacio para contestar.
 *
 * Y el fallo no es una respuesta peor: es una respuesta VACÍA. La API devuelve
 * `status: incomplete` con `reason: max_output_tokens` y el texto en blanco, así
 * que el punto de llamada degrada a su respuesta de respaldo en CADA petición,
 * de forma indistinguible de una caída del proveedor.
 *
 * Ocurrió al reapuntar `soflia_dialogue_evaluator` a un modelo de OpenAI desde
 * el panel: los 4.096 tokens que bastaban en Gemini se los comía el esfuerzo de
 * razonamiento por defecto (`medium`), la evaluación de las actividades falló en
 * todos los turnos y el alumnado recibió el mensaje de recuperación técnica en
 * lugar de su calificación.
 *
 * DECISIÓN DE DISEÑO: el número del panel se interpreta como "tokens de
 * respuesta VISIBLE" —lo único que un administrador puede estimar mirando una
 * respuesta— y el margen de razonamiento lo añade la plataforma, que es la única
 * capa que sabe lo que cuesta en cada proveedor. El ajuste solo SUMA: nunca
 * reduce un presupuesto configurado, y no toca a los modelos que no razonan.
 *
 * COSTE: ninguno por reservar. Los dos proveedores facturan tokens generados, no
 * presupuestados; un margen amplio que no se usa no se paga.
 *
 * Módulo puro: sin dependencias del SDK ni del entorno.
 */

/**
 * Tokens de razonamiento a reservar por nivel.
 *
 * Réplica deliberada de la escala de `THINKING_BUDGET_BY_LEVEL` (Gemini): es la
 * calibración que la plataforma ya usa para el mismo concepto, y mantener dos
 * escalas distintas para "cuánto razona un modelo" garantizaría que se
 * desincronizasen.
 */
const REASONING_HEADROOM_BY_LEVEL: Record<AiThinkingLevel, number> = {
  // `default` y `dynamic` NO envían nivel al proveedor: manda su comportamiento
  // propio, que en la familia GPT-5 es `medium`. Se reserva como tal, porque es
  // lo que realmente se va a gastar.
  default: 8_192,
  dynamic: 8_192,
  high: 24_576,
  low: 2_048,
  medium: 8_192,
  off: 0,
}

/**
 * Multiplicador de tiempo de espera por nivel de razonamiento.
 *
 * El mismo error de contabilidad que con los tokens, pero en el eje del tiempo:
 * un modelo con esfuerzo `high` puede pasar decenas de segundos razonando antes
 * del primer token, y los tiempos de espera de la plataforma se calibraron con
 * modelos que responden de inmediato. El que se queda corto no devuelve una
 * respuesta peor: aborta, y el punto de llamada degrada a su plantilla fija sin
 * que nadie vea un error.
 */
const TIMEOUT_MULTIPLIER_BY_LEVEL: Record<AiThinkingLevel, number> = {
  default: 2,
  dynamic: 2,
  high: 3,
  low: 1.5,
  medium: 2,
  off: 1,
}

/** Familias de Gemini que descuentan el razonamiento del presupuesto de salida. */
const GEMINI_REASONING_MODEL_PATTERN = /^gemini-[3-9]/

/**
 * `true` cuando el modelo consume presupuesto de salida razonando antes de
 * escribir.
 *
 * Comparte criterio con `reasonsInternally` de `prompt-variants.ts`, que decide
 * la variante de prompt. Se mantienen separados a propósito: aquel responde
 * "¿hace falta pedirle que delibere por texto?" y este "¿cuántos tokens se va a
 * gastar antes de contestar?". Un modelo futuro podría cambiar una respuesta sin
 * cambiar la otra.
 */
export function consumesOutputBudgetReasoning(params: {
  model: string
  provider: AiProvider
  thinkingLevel?: AiThinkingLevel
}): boolean {
  if (params.thinkingLevel === 'off') return false

  const normalizedModel = params.model.trim().toLowerCase()

  return params.provider === 'openai'
    ? supportsOpenAiReasoning(normalizedModel)
    : GEMINI_REASONING_MODEL_PATTERN.test(normalizedModel)
}

/**
 * Devuelve el presupuesto a enviar al proveedor: el visible más el margen de
 * razonamiento que corresponda al modelo.
 *
 * `undefined` entra y sale sin tocarse: significa "sin presupuesto fijado", y
 * ponerle uno aquí sería introducir un límite donde el punto de llamada
 * decidió no tenerlo.
 */
export function applyReasoningHeadroom(params: {
  maxOutputTokens: number | undefined
  model: string
  provider: AiProvider
  thinkingLevel?: AiThinkingLevel
}): number | undefined {
  const { maxOutputTokens } = params
  if (!maxOutputTokens || !consumesOutputBudgetReasoning(params)) {
    return maxOutputTokens
  }

  const headroom = REASONING_HEADROOM_BY_LEVEL[params.thinkingLevel ?? 'default']

  return Math.min(
    maxOutputTokens + headroom,
    AI_MODEL_SETTINGS_LIMITS.maxOutputTokens.max,
  )
}

/**
 * Amplía un tiempo de espera para dar cabida al razonamiento del modelo.
 *
 * `maxTimeoutMs` lo fija el punto de llamada porque el techo no es técnico sino
 * de producto: lo que un estudiante tolera esperando en pantalla no es lo mismo
 * que lo que tolera un proceso por lotes, y ninguno puede superar el límite de
 * ejecución de la función que los aloja.
 *
 * Solo amplía: un modelo que no razona conserva su tiempo de espera original.
 */
export function scaleTimeoutForReasoning(params: {
  baseTimeoutMs: number
  maxTimeoutMs: number
  model: string
  provider: AiProvider
  thinkingLevel?: AiThinkingLevel
}): number {
  if (!consumesOutputBudgetReasoning(params)) return params.baseTimeoutMs

  const multiplier = TIMEOUT_MULTIPLIER_BY_LEVEL[params.thinkingLevel ?? 'default']

  return Math.min(Math.round(params.baseTimeoutMs * multiplier), params.maxTimeoutMs)
}
