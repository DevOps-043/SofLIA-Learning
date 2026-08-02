import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

import {
  isAiProviderSelection,
  resolveAiProvider,
  type AiProviderSelection,
} from '../providers/provider-registry'

import {
  AI_MODEL_PURPOSES,
  PLATFORM_DEFAULT_AI_PROVIDER,
  getAiModelPurpose,
  type AiModelPurpose,
  type AiModelPurposeId,
} from './purposes'
import { isAiThinkingLevel, type AiThinkingLevel } from './thinking'
import type {
  AiModelSettingsUpdate,
  ResolvedAiModelSettings,
} from './types'

/**
 * Resolución de la configuración efectiva de modelos de IA.
 *
 * PRECEDENCIA: override en base de datos → variable de entorno legacy → default
 * de código. Esa cadena garantiza que desplegar esta funcionalidad no cambie el
 * comportamiento vigente y que un rollback de la migración siga funcionando.
 *
 * RENDIMIENTO: la tabla tiene una fila por propósito (≈20 filas). Se lee ENTERA
 * de una sola vez y se cachea en memoria del proceso durante `CACHE_TTL_MS`, de
 * modo que las rutas calientes de IA no añaden un round-trip a Postgres por
 * petición. Las peticiones concurrentes que encuentran la caché fría comparten
 * la misma promesa (evita el efecto "thundering herd" al expirar).
 *
 * CONSISTENCIA: con varias instancias serverless, un cambio desde el panel tarda
 * como máximo `CACHE_TTL_MS` en propagarse a todas. Es aceptable de forma
 * deliberada para un parámetro de configuración; la instancia que atiende la
 * escritura invalida su caché de inmediato.
 *
 * DISPONIBILIDAD: cualquier fallo al leer la base degrada a entorno/defaults en
 * lugar de propagar el error. Un problema de configuración nunca debe dejar sin
 * servicio a SofLIA.
 */

const CACHE_TTL_MS = 60_000

interface AiModelSettingsRow {
  max_output_tokens: number | null
  model: string
  /** `null` = deducir el proveedor del nombre del modelo. */
  provider: string | null
  purpose: string
  temperature: number | null
  thinking_level: string
  updated_at: string
}

interface OverridesCache {
  expiresAt: number
  overrides: Map<string, AiModelSettingsRow>
}

let cache: OverridesCache | null = null
let inFlightLoad: Promise<Map<string, AiModelSettingsRow>> | null = null

async function fetchOverridesFromDatabase(): Promise<Map<string, AiModelSettingsRow>> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('ai_model_settings')
    .select(
      'purpose, model, provider, max_output_tokens, temperature, thinking_level, updated_at',
    )

  if (error) {
    throw new Error(error.message)
  }

  return new Map(
    (data ?? []).map((row) => [row.purpose, row as AiModelSettingsRow]),
  )
}

async function loadOverrides(): Promise<Map<string, AiModelSettingsRow>> {
  const now = Date.now()
  if (cache && cache.expiresAt > now) {
    return cache.overrides
  }

  if (inFlightLoad) {
    return inFlightLoad
  }

  inFlightLoad = fetchOverridesFromDatabase()
    .then((overrides) => {
      cache = { expiresAt: Date.now() + CACHE_TTL_MS, overrides }
      return overrides
    })
    .catch((error: unknown) => {
      logger.warn('No se pudo leer ai_model_settings; se usan entorno/defaults', {
        error: error instanceof Error ? error.message : 'unknown',
      })
      // Caché negativa corta: evita martillear la base mientras dure la avería,
      // sin congelar la configuración cuando se restablezca.
      const empty = new Map<string, AiModelSettingsRow>()
      cache = { expiresAt: Date.now() + CACHE_TTL_MS, overrides: empty }
      return empty
    })
    .finally(() => {
      inFlightLoad = null
    })

  return inFlightLoad
}

function readModelFromEnv(purpose: AiModelPurpose): string | null {
  for (const envVar of purpose.legacyModelEnvVars) {
    const value = process.env[envVar]?.trim()
    if (value) return value
  }

  return null
}

function readPositiveIntFromEnv(envVar: string | undefined): number | null {
  if (!envVar) return null

  const parsed = Number.parseInt(process.env[envVar] ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function readTemperatureFromEnv(envVar: string | undefined): number | null {
  if (!envVar) return null

  const parsed = Number.parseFloat(process.env[envVar] ?? '')
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 2 ? parsed : null
}

function resolveThinkingLevel(rawValue: string | undefined): AiThinkingLevel | null {
  return isAiThinkingLevel(rawValue) ? rawValue : null
}

function resolveSettings(
  purpose: AiModelPurpose,
  override: AiModelSettingsRow | undefined,
): ResolvedAiModelSettings {
  const envModel = readModelFromEnv(purpose)
  const legacyMaxOutputTokensEnvVar =
    'legacyMaxOutputTokensEnvVar' in purpose
      ? purpose.legacyMaxOutputTokensEnvVar
      : undefined
  const legacyTemperatureEnvVar =
    'legacyTemperatureEnvVar' in purpose
      ? purpose.legacyTemperatureEnvVar
      : undefined

  const model = override?.model ?? envModel ?? purpose.defaults.model
  const modelSource = override?.model
    ? 'database'
    : envModel
      ? 'environment'
      : 'default'

  // `auto` es el valor por defecto y significa "deducir del nombre del modelo".
  // Un valor inesperado en la columna (escritura manual por SQL) degrada a `auto`
  // en lugar de romper: la deducción sigue dando un proveedor válido.
  const providerSelection: AiProviderSelection = isAiProviderSelection(override?.provider)
    ? override.provider
    : 'auto'
  const provider = resolveAiProvider({
    fallback: PLATFORM_DEFAULT_AI_PROVIDER,
    model,
    selection: providerSelection,
  })

  const maxOutputTokens =
    override?.max_output_tokens ??
    readPositiveIntFromEnv(legacyMaxOutputTokensEnvVar) ??
    purpose.defaults.maxOutputTokens

  const temperature =
    override?.temperature ??
    readTemperatureFromEnv(legacyTemperatureEnvVar) ??
    purpose.defaults.temperature

  return {
    hasDatabaseOverride: Boolean(override),
    maxOutputTokens,
    model,
    modelSource,
    provider,
    providerSelection,
    purpose: purpose.id,
    temperature,
    thinkingLevel:
      resolveThinkingLevel(override?.thinking_level) ??
      purpose.defaults.thinkingLevel,
    updatedAt: override?.updated_at ?? null,
  }
}

/**
 * Configuración efectiva de un propósito, lista para enviar al proveedor.
 * Nunca lanza por problemas de base de datos: degrada a entorno/defaults.
 */
export async function getAiModelSettings(
  purposeId: AiModelPurposeId,
): Promise<ResolvedAiModelSettings> {
  const purpose = getAiModelPurpose(purposeId)
  const overrides = await loadOverrides()

  return resolveSettings(purpose, overrides.get(purposeId))
}

/** Configuración efectiva de todos los propósitos, para el panel de administración. */
export async function getAllAiModelSettings(): Promise<ResolvedAiModelSettings[]> {
  const overrides = await loadOverrides()

  return AI_MODEL_PURPOSES.map((purpose) =>
    resolveSettings(purpose, overrides.get(purpose.id)),
  )
}

/**
 * Invalida la caché del proceso. Se llama tras cada escritura para que la
 * instancia que atendió el cambio lo refleje de inmediato.
 */
export function invalidateAiModelSettingsCache(): void {
  cache = null
}

/**
 * Persiste un override. Espera valores YA validados por
 * `parseAiModelSettingsUpdate`; esta función no valida rangos de nuevo, solo
 * escribe y confía además en los CHECK constraints de la tabla como última red.
 */
export async function upsertAiModelSettings(params: {
  actorId: string
  purposeId: AiModelPurposeId
  update: AiModelSettingsUpdate
}): Promise<ResolvedAiModelSettings> {
  const purpose = getAiModelPurpose(params.purposeId)
  const current = await getAiModelSettings(params.purposeId)

  // `null` y "campo ausente" NO son lo mismo y no pueden colapsarse con `??`:
  // `null` es una orden explícita de volver al valor heredado, mientras que un
  // campo ausente debe conservar el valor efectivo actual. Se distingue por
  // presencia de la clave.
  const { update } = params
  const nextModel = update.model ?? current.model
  const nextMaxOutputTokens = purpose.capabilities.maxOutputTokens
    ? 'maxOutputTokens' in update
      ? update.maxOutputTokens ?? null
      : current.maxOutputTokens
    : null
  const nextTemperature = purpose.capabilities.temperature
    ? 'temperature' in update
      ? update.temperature ?? null
      : current.temperature
    : null
  const nextThinkingLevel = purpose.capabilities.thinkingLevel
    ? update.thinkingLevel ?? current.thinkingLevel
    : 'default'

  // `auto` se persiste como NULL para que la columna signifique una sola cosa:
  // "hay un proveedor fijado a mano". Guardar la cadena 'auto' obligaría a
  // interpretarla en cada lectura y en cualquier consulta SQL externa.
  const nextProviderSelection = update.provider ?? current.providerSelection
  const nextProvider = nextProviderSelection === 'auto' ? null : nextProviderSelection

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('ai_model_settings')
    .upsert(
      {
        max_output_tokens: nextMaxOutputTokens,
        model: nextModel,
        provider: nextProvider,
        purpose: params.purposeId,
        temperature: nextTemperature,
        thinking_level: nextThinkingLevel,
        updated_by: params.actorId,
      },
      { onConflict: 'purpose' },
    )

  if (error) {
    logger.error('Fallo al guardar ai_model_settings', {
      error: error.message,
      purpose: params.purposeId,
    })
    throw new Error('AI_MODEL_SETTINGS_WRITE_FAILED')
  }

  invalidateAiModelSettingsCache()
  return getAiModelSettings(params.purposeId)
}

/**
 * Elimina el override y devuelve el propósito a su valor heredado
 * (entorno → default de código).
 *
 * Antes de borrar se sella `updated_by` con quien ejecuta la acción: el trigger
 * de auditoría toma el actor de la fila, y sin este paso el borrado quedaría
 * atribuido a quien hizo el último cambio, no a quien lo revirtió.
 */
export async function resetAiModelSettings(params: {
  actorId: string
  purposeId: AiModelPurposeId
}): Promise<ResolvedAiModelSettings> {
  const { actorId, purposeId } = params
  const supabase = createAdminClient()

  await supabase
    .from('ai_model_settings')
    .update({ updated_by: actorId })
    .eq('purpose', purposeId)

  const { error } = await supabase
    .from('ai_model_settings')
    .delete()
    .eq('purpose', purposeId)

  if (error) {
    logger.error('Fallo al restablecer ai_model_settings', {
      error: error.message,
      purpose: purposeId,
    })
    throw new Error('AI_MODEL_SETTINGS_RESET_FAILED')
  }

  invalidateAiModelSettingsCache()
  return getAiModelSettings(purposeId)
}
