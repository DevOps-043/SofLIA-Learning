/**
 * Registro de proveedores de IA y deducción del proveedor a partir del modelo.
 *
 * OBJETIVO: que un superadministrador solo tenga que escribir el nombre del
 * modelo (`gemini-3.5-flash`, `gpt-5.1`, …) en el panel y la plataforma dirija la
 * llamada al proveedor correcto sin configuración adicional.
 *
 * DECISIÓN DE DISEÑO: la deducción devuelve `null` cuando el identificador no
 * coincide con ningún patrón conocido, en lugar de asumir un proveedor por
 * defecto. Asumirlo convertiría una errata (`gtp-5.1`) en una llamada silenciosa
 * al proveedor equivocado, que fallaría en producción con un error opaco. Con
 * `null`, la validación exige que el administrador elija el proveedor de forma
 * explícita y el fallo ocurre al guardar, no al atender a un usuario.
 *
 * Módulo puro y sin dependencias: lo consumen el servidor (al construir la
 * llamada) y el panel de administración en el navegador (para previsualizar el
 * proveedor deducido mientras se escribe).
 */

export const AI_PROVIDERS = ['google', 'openai'] as const

export type AiProvider = (typeof AI_PROVIDERS)[number]

/**
 * Valor de configuración del panel. `auto` significa "deducir del nombre del
 * modelo" y es lo que se guarda como `NULL` en base de datos.
 */
export const AI_PROVIDER_SELECTIONS = ['auto', ...AI_PROVIDERS] as const

export type AiProviderSelection = (typeof AI_PROVIDER_SELECTIONS)[number]

export function isAiProvider(value: unknown): value is AiProvider {
  return typeof value === 'string' && (AI_PROVIDERS as readonly string[]).includes(value)
}

export function isAiProviderSelection(value: unknown): value is AiProviderSelection {
  return (
    typeof value === 'string' && (AI_PROVIDER_SELECTIONS as readonly string[]).includes(value)
  )
}

/**
 * Prefijos de identificador de modelo por proveedor.
 *
 * Se comparan sobre el identificador en minúsculas y en el orden declarado. Son
 * prefijos y no expresiones cerradas a propósito: cada proveedor publica modelos
 * nuevos con la misma familia de nombres (`gpt-5.2`, `gemini-4-flash`) y el
 * panel debe aceptarlos el mismo día sin desplegar código.
 */
const MODEL_PREFIXES_BY_PROVIDER: Record<AiProvider, readonly string[]> = {
  google: ['gemini-', 'gemma-', 'learnlm-', 'imagen-', 'veo-', 'text-embedding-00'],
  openai: [
    'gpt-',
    'chatgpt-',
    'codex-',
    'davinci-',
    'babbage-',
    'text-embedding-3',
    'omni-moderation',
    // Los modelos afinados se identifican como `ft:<modelo-base>:<org>::<id>`.
    'ft:',
  ],
}

/**
 * Familias de razonamiento de OpenAI, que se nombran con una letra y un número
 * (`o1`, `o3`, `o4-mini`) y no encajan en el esquema de prefijos anterior.
 */
const OPENAI_REASONING_FAMILY_PATTERN = /^o[1-9](?:-|$)/

/**
 * Deduce el proveedor a partir del identificador del modelo.
 * Devuelve `null` cuando no se reconoce, para que quien llame decida (validación
 * estricta al guardar, proveedor explícito en runtime).
 */
export function inferAiProvider(model: string): AiProvider | null {
  const normalized = model.trim().toLowerCase()
  if (!normalized) return null

  if (OPENAI_REASONING_FAMILY_PATTERN.test(normalized)) return 'openai'

  for (const provider of AI_PROVIDERS) {
    if (MODEL_PREFIXES_BY_PROVIDER[provider].some((prefix) => normalized.startsWith(prefix))) {
      return provider
    }
  }

  return null
}

/**
 * Resuelve el proveedor efectivo combinando la selección guardada con la
 * deducción. Una selección explícita SIEMPRE gana sobre el nombre del modelo:
 * es la vía de escape para modelos nuevos o alias corporativos que el registro
 * todavía no reconoce.
 */
export function resolveAiProvider(params: {
  fallback: AiProvider
  model: string
  selection: AiProviderSelection | null | undefined
}): AiProvider {
  if (isAiProvider(params.selection)) return params.selection

  return inferAiProvider(params.model) ?? params.fallback
}

/**
 * Modelos de OpenAI con razonamiento interno.
 *
 * Importa porque la API rechaza (400) `temperature` en estos modelos y rechaza
 * `reasoning` en los que no razonan: enviar el parámetro equivocado no degrada,
 * rompe la llamada. La heurística evita el viaje de ida y vuelta en el caso
 * habitual; el adaptador reintenta sin el parámetro si el proveedor lo rechaza,
 * de modo que un modelo futuro no clasificado aquí siga funcionando.
 */
const OPENAI_REASONING_MODEL_PATTERN = /^(?:o[1-9](?:-|$)|gpt-[5-9]|codex-)/

export function supportsOpenAiReasoning(model: string): boolean {
  return OPENAI_REASONING_MODEL_PATTERN.test(model.trim().toLowerCase())
}

/** Los modelos de razonamiento de OpenAI no admiten `temperature`. */
export function supportsOpenAiTemperature(model: string): boolean {
  return !supportsOpenAiReasoning(model)
}

/**
 * `minimal` solo existe en la familia GPT-5 y posteriores; en la serie `o` el
 * esfuerzo más bajo disponible es `low`.
 */
export function supportsOpenAiMinimalReasoning(model: string): boolean {
  return /^(?:gpt-[5-9]|codex-)/.test(model.trim().toLowerCase())
}
