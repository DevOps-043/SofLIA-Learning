import type { AiThinkingLevel } from '../model-settings/thinking'
import type { AiProvider } from '../providers/provider-registry'

/**
 * Selección de la variante de prompt según el proveedor destino.
 *
 * MODELO MENTAL: cada prompt tiene UNA VARIANTE ESCRITA A MANO POR PROVEEDOR.
 * No se genera una redacción común a partir de plantillas: los prompts de Gemini
 * están calibrados con meses de uso real y deben permanecer intactos, mientras
 * que la variante de OpenAI se escribe de cero para ese modelo.
 *
 * POR QUÉ VARIANTES SEPARADAS Y NO UN PROMPT PARAMETRIZADO:
 * - Un prompt "común" con piezas intercambiables acaba siendo el mínimo común
 *   denominador: mediocre en los dos proveedores.
 * - Tocar la redacción compartida para mejorar OpenAI degradaría, sin querer, el
 *   comportamiento ya validado en Gemini. Con variantes separadas, un cambio en
 *   una NO puede afectar a la otra.
 * - Las diferencias reales no son cosméticas: Gemini necesita que se le prohíban
 *   las vallas ```json (las añade igualmente); la API de Respuestas de OpenAI ya
 *   garantiza la forma con esquema nativo. A los modelos de razonamiento de
 *   OpenAI pedirles "piensa paso a paso" les consume presupuesto de razonamiento
 *   y empeora la respuesta, mientras que en un Gemini sin thinking ayuda.
 */

/**
 * Datos del modelo destino que el prompt puede necesitar para elegir variante o
 * ajustar un detalle dentro de ella.
 */
export interface PromptModelProfile {
  model: string
  provider: AiProvider
  /**
   * `true` si el modelo delibera internamente antes de responder.
   *
   * Determina si la variante debe pedir razonamiento explícito o callarse: en un
   * modelo que ya razona, pedírselo compite con su propio proceso y consume el
   * mismo presupuesto de salida.
   */
  reasonsInternally: boolean
  thinkingLevel: AiThinkingLevel
}

/**
 * Par de variantes de un prompt. Cada una es texto escrito a mano para su
 * proveedor; no comparten redacción.
 */
export interface PromptVariants<TArgs extends readonly unknown[] = []> {
  google: (...args: TArgs) => string
  openai: (profile: PromptModelProfile, ...args: TArgs) => string
}
