import 'server-only'

import { logger } from '@/lib/utils/logger'

import { getGeminiApiKey, resolveGeminiModel } from './google.adapter.server'
import { getOpenAiApiKey, getOpenAiClient } from './openai-client.server'
import type { AiProvider } from './provider-registry'

/**
 * Comprobación de que un identificador de modelo EXISTE en su proveedor.
 *
 * QUÉ HUECO CIERRA: `assertProviderIsResolvable` valida que el nombre tenga un
 * proveedor deducible, y el patrón de `AI_MODEL_SETTINGS_LIMITS` valida que sea
 * un identificador con forma legal. Ninguna de las dos comprueba que el modelo
 * exista: `gpt-5.6-terra` y `gpt-5.6-terrra` superan ambas. La errata se guarda,
 * el panel muestra "Configurado", y el fallo aparece días después como un 404
 * del proveedor en mitad de la actividad de un empleado.
 *
 * POLÍTICA CENTRAL — "no verificable" NO es "inválido":
 *
 *   exists     -> el proveedor confirma el modelo.
 *   missing    -> el proveedor confirma que NO existe. Único caso que bloquea.
 *   unverified -> no se pudo preguntar (sin credenciales, red caída, cuota).
 *
 * Un `unverified` NUNCA impide guardar. Bloquear la configuración porque el
 * proveedor está caído convertiría una incidencia suya en una incidencia
 * nuestra, y dejaría al administrador sin poder reaccionar —justo cuando
 * cambiar de modelo es la reacción—. Se guarda y se registra el aviso.
 */

export type AiModelCheckStatus = 'exists' | 'missing' | 'unverified'

export interface AiModelCheck {
  /** Modelos parecidos del catálogo, para corregir una errata sin salir del panel. */
  suggestions: string[]
  /** Código estable del motivo cuando no se pudo verificar. Nunca incluye el secreto. */
  reason?: string
  status: AiModelCheckStatus
}

/** Un catálogo cambia de mes en mes; se pregunta al guardar, no en caliente. */
const POSITIVE_CACHE_TTL_MS = 10 * 60_000
/**
 * Los negativos caducan mucho antes: un modelo recién publicado no debe quedar
 * rechazado durante diez minutos por una respuesta que ya envejeció.
 */
const NEGATIVE_CACHE_TTL_MS = 60_000
const CATALOG_TIMEOUT_MS = 6_000
const MAX_SUGGESTIONS = 5

const GOOGLE_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'

interface CacheEntry {
  expiresAt: number
  result: AiModelCheck
}

const cache = new Map<string, CacheEntry>()

function readCache(key: string): AiModelCheck | null {
  const entry = cache.get(key)
  if (!entry) return null

  if (entry.expiresAt <= Date.now()) {
    cache.delete(key)
    return null
  }

  return entry.result
}

function writeCache(key: string, result: AiModelCheck): AiModelCheck {
  // `unverified` no se cachea: es un estado transitorio y guardarlo alargaría
  // una caída puntual del proveedor más allá de su duración real.
  if (result.status !== 'unverified') {
    cache.set(key, {
      expiresAt:
        Date.now() +
        (result.status === 'exists' ? POSITIVE_CACHE_TTL_MS : NEGATIVE_CACHE_TTL_MS),
      result,
    })
  }

  return result
}

/** Reinicio explícito para pruebas y para forzar una recomprobación. */
export function clearAiModelCatalogCache(): void {
  cache.clear()
}

/**
 * Modelos del catálogo parecidos al escrito. Compara por la raíz del nombre
 * —lo que un dedo resbalado no suele cambiar— en lugar de por distancia de
 * edición, que con identificadores tan estructurados produce sugerencias peores.
 */
function findSuggestions(model: string, catalog: string[]): string[] {
  const normalized = model.trim().toLowerCase()
  const root = normalized.slice(0, 5)

  return catalog
    .filter((candidate) => {
      const candidateName = candidate.toLowerCase()
      return candidateName.startsWith(root) || normalized.startsWith(candidateName.slice(0, 5))
    })
    .slice(0, MAX_SUGGESTIONS)
}

async function listOpenAiModels(): Promise<string[]> {
  const models: string[] = []

  for await (const model of getOpenAiClient().models.list()) {
    models.push(model.id)
  }

  return models
}

async function checkOpenAiModel(model: string): Promise<AiModelCheck> {
  if (!getOpenAiApiKey()) {
    return { reason: 'AI_API_KEY_MISSING:openai', status: 'unverified', suggestions: [] }
  }

  const client = getOpenAiClient()

  try {
    // `retrieve` es la vía barata y exacta: una petición, sin paginar el
    // catálogo entero ni los modelos afinados de la organización.
    await client.models.retrieve(model, { timeout: CATALOG_TIMEOUT_MS })
    return { status: 'exists', suggestions: [] }
  } catch (error) {
    const status = (error as { status?: unknown }).status

    if (status !== 404) {
      // 401/403/429/5xx no dicen nada sobre el modelo, solo sobre el acceso.
      return { reason: `AI_CATALOG_UNAVAILABLE:${status ?? 'network'}`, status: 'unverified', suggestions: [] }
    }

    // Solo tras confirmar la ausencia se paga el listado, y únicamente para
    // poder sugerir el nombre correcto.
    const suggestions = await listOpenAiModels()
      .then((catalog) => findSuggestions(model, catalog))
      .catch(() => [])

    return { status: 'missing', suggestions }
  }
}

/**
 * La clave viaja en cabecera, no en `?key=`: una URL con el secreto acaba en
 * trazas, mensajes de error y registros de red.
 */
async function fetchGoogleCatalog(path: string, apiKey: string): Promise<Response> {
  return fetch(`${GOOGLE_API_BASE_URL}${path}`, {
    headers: { 'x-goog-api-key': apiKey },
    signal: AbortSignal.timeout(CATALOG_TIMEOUT_MS),
  })
}

async function listGoogleModels(apiKey: string): Promise<string[]> {
  const response = await fetchGoogleCatalog('/models?pageSize=200', apiKey)
  if (!response.ok) return []

  const payload = (await response.json()) as { models?: { name?: string }[] }

  return (payload.models ?? [])
    .map((entry) => entry.name?.replace(/^models\//, ''))
    .filter((name): name is string => Boolean(name))
}

async function checkGoogleModel(model: string): Promise<AiModelCheck> {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    return { reason: 'AI_API_KEY_MISSING:google', status: 'unverified', suggestions: [] }
  }

  try {
    const response = await fetchGoogleCatalog(`/models/${encodeURIComponent(model)}`, apiKey)

    if (response.ok) return { status: 'exists', suggestions: [] }

    if (response.status !== 404) {
      return {
        reason: `AI_CATALOG_UNAVAILABLE:${response.status}`,
        status: 'unverified',
        suggestions: [],
      }
    }

    const suggestions = await listGoogleModels(apiKey)
      .then((catalog) => findSuggestions(model, catalog))
      .catch(() => [])

    return { status: 'missing', suggestions }
  } catch {
    return { reason: 'AI_CATALOG_UNAVAILABLE:network', status: 'unverified', suggestions: [] }
  }
}

/**
 * Comprueba que el modelo exista en el proveedor indicado.
 *
 * En Gemini se verifica el modelo YA RESUELTO: el adaptador redirige las
 * generaciones retiradas al modelo vigente, así que un nombre heredado sí es
 * ejecutable y rechazarlo sería mentir sobre lo que hará la plataforma.
 */
export async function checkAiModelExists(params: {
  model: string
  provider: AiProvider
}): Promise<AiModelCheck> {
  const model =
    params.provider === 'google' ? resolveGeminiModel(params.model) : params.model.trim()

  const cacheKey = `${params.provider}:${model}`
  const cached = readCache(cacheKey)
  if (cached) return cached

  const result =
    params.provider === 'openai'
      ? await checkOpenAiModel(model)
      : await checkGoogleModel(model)

  if (result.status === 'unverified') {
    logger.warn('No se pudo verificar el modelo de IA contra su proveedor', {
      model,
      provider: params.provider,
      reason: result.reason,
    })
  }

  return writeCache(cacheKey, result)
}
