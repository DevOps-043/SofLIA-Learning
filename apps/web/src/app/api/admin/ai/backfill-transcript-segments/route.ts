import { NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { parseTranscriptSegments } from '@/lib/course-content/transcript-segments'

// Cada lección implica subir y analizar un vídeo completo (1-3 min). Un lote de
// varias supera de largo el timeout por defecto de una función serverless, así
// que se declara el máximo permitido para no cortar el procesamiento a medias.
export const runtime = 'nodejs'
export const maxDuration = 300

/**
 * Regeneración masiva de transcripciones con marcas de tiempo.
 *
 * Las transcripciones creadas antes de `20260723090000` son texto plano sin
 * tiempos, así que SofLIA no puede citar minutos en esas lecciones. El timestamp
 * no se puede deducir del texto ya guardado: hay que volver a pasar el vídeo por
 * el modelo.
 *
 * DISEÑO:
 * - `GET`  → sólo informa de cuántas lecciones faltan (no consume cuota).
 * - `POST` → procesa un lote acotado. Reprocesar cuesta llamadas a Gemini y
 *   tiempo de vídeo, así que NUNCA se lanza el catálogo entero de una vez: el
 *   cliente decide cuántas y repite hasta que `pending` llega a cero.
 *
 * Es idempotente: sólo toma lecciones con `transcript_segments IS NULL`, de modo
 * que reintentar tras un fallo parcial no repite trabajo ya hecho.
 */

/** Tope duro por petición: acota coste de API y evita agotar el tiempo de la función. */
const MAX_BATCH_SIZE = 10
const DEFAULT_BATCH_SIZE = 3

interface PendingLessonRow {
  lesson_id: string
  lesson_title: string | null
  duration_seconds: number | null
  video_provider: string | null
  video_provider_id: string | null
}

async function countPendingLessons(): Promise<number> {
  const supabase = createAdminClient()
  const { count } = await supabase
    .from('course_lessons')
    .select('lesson_id', { count: 'exact', head: true })
    .is('transcript_segments', null)

  return count ?? 0
}

/**
 * Estado del reprocesamiento. No consume cuota de Gemini.
 *
 * Separa lo pendiente entre lo que SE PUEDE reprocesar y lo que no: sólo son
 * reprocesables los vídeos alojados en Supabase Storage, así que un total a secas
 * daría una expectativa falsa de cuánto se puede arreglar.
 */
export async function GET() {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const supabase = createAdminClient()
    const { data } = await supabase
      .from('course_lessons')
      .select('video_provider, video_provider_id')
      .is('transcript_segments', null)
      .limit(5_000)

    const rows = (data ?? []) as Array<{
      video_provider: string | null
      video_provider_id: string | null
    }>

    // Desglose por proveedor: distingue de un vistazo si lo que falta es
    // autorizar un host o si hay lecciones sin vídeo utilizable.
    const byProvider: Record<string, number> = {}
    for (const row of rows) {
      const key = row.video_provider ?? 'sin-proveedor'
      byProvider[key] = (byProvider[key] ?? 0) + 1
    }

    const notReprocessableByReason: Record<string, number> = {}
    // Hosts que están bloqueando descargas: es exactamente lo que hay que
    // declarar en SAFE_FETCH_ALLOWED_HOSTS para desbloquear el reprocesamiento.
    const blockedHosts: Record<string, number> = {}
    let reprocessable = 0

    for (const row of rows) {
      const resolved = resolveDownloadableVideoUrl(row)
      if ('url' in resolved) {
        reprocessable += 1
        continue
      }
      notReprocessableByReason[resolved.reason] =
        (notReprocessableByReason[resolved.reason] ?? 0) + 1
      if (resolved.blockedHost) {
        blockedHosts[resolved.blockedHost] = (blockedHosts[resolved.blockedHost] ?? 0) + 1
      }
    }

    // Muestra de cómo son realmente los `video_provider_id`, para poder ver por
    // qué se rechazan. Se recorta a host + ruta: la query string de Storage puede
    // llevar tokens de acceso y no debe acabar en una respuesta ni en un log.
    const sampleUrls = rows.slice(0, 6).map((row) => {
      const raw = row.video_provider_id ?? ''
      if (!raw.startsWith('http')) {
        return { provider: row.video_provider, shape: 'no-es-url', value: raw.slice(0, 80) }
      }
      try {
        const parsed = new URL(raw)
        return {
          host: parsed.hostname,
          hostLength: parsed.hostname.length,
          path: parsed.pathname.slice(0, 90),
          provider: row.video_provider,
        }
      } catch {
        return { provider: row.video_provider, shape: 'url-invalida', value: raw.slice(0, 80) }
      }
    })

    return NextResponse.json({
      allowedHosts: getDownloadableHostnames(),
      // Longitudes para detectar caracteres invisibles o confusiones tipo l/1.
      allowedHostsLengths: getDownloadableHostnames().map((host) => host.length),
      // Diferencia exacta entre lo autorizado y lo que llega, cuando parecen
      // iguales pero no coinciden (homoglifos Unicode al copiar y pegar).
      hostMismatch: describeHostMismatch(
        Object.keys(blockedHosts)[0],
        getDownloadableHostnames(),
      ),
      blockedHosts,
      byProvider,
      notReprocessable: rows.length - reprocessable,
      notReprocessableByReason,
      pending: await countPendingLessons(),
      reprocessable,
      sampleUrls,
      success: true,
    })
  } catch (error) {
    logger.error('Backfill de segmentos: fallo al contar pendientes', error)
    return NextResponse.json(
      { error: 'No se pudo consultar el estado del reprocesamiento', success: false },
      { status: 500 },
    )
  }
}

/**
 * Procesa un lote de lecciones pendientes.
 *
 * Devuelve el detalle por lección para que un fallo aislado (vídeo borrado,
 * formato no soportado) sea visible y no quede enmascarado en un contador.
 */
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const options = await resolvePostOptions(request)
    const supabase = createAdminClient()

    // Filtro base: lecciones pendientes de segmentos. Con `lessonTitleContains` se
    // acota a una lección concreta —útil para reprocesar y verificar justo la que
    // el usuario está viendo en vez de una cualquiera de la cola—; sin él, se toma
    // el siguiente lote de la cola general.
    let query = supabase
      .from('course_lessons')
      .select('lesson_id, lesson_title, duration_seconds, video_provider, video_provider_id')
      .is('transcript_segments', null)

    if (options.lessonId) {
      query = query.eq('lesson_id', options.lessonId)
    } else if (options.lessonTitleContains) {
      query = query.ilike('lesson_title', `%${options.lessonTitleContains}%`)
    }

    // Se leen más filas de las que se van a procesar para poder descartar las no
    // reprocesables SIN gastar una llamada a Gemini en ellas: de lo contrario un
    // lote podría consumirse entero en lecciones condenadas a fallar.
    const { data, error } = await query.limit(options.batchSize * 20)

    if (error) {
      throw new Error(error.message)
    }

    const lessons = ((data ?? []) as PendingLessonRow[])
      .filter((lesson) => 'url' in resolveDownloadableVideoUrl(lesson))
      .slice(0, options.batchSize)
    if (lessons.length === 0) {
      return NextResponse.json({
        pending: 0,
        processed: [],
        success: true,
      })
    }

    // `process-video` está protegido con requireAdmin: sin reenviar la cookie de
    // sesión del admin que lanza el backfill, cada llamada interna respondería 401
    // y el lote entero fallaría.
    const sessionCookie = request.headers.get('cookie') ?? ''

    const processed = []
    for (const lesson of lessons) {
      processed.push(await reprocessLesson(lesson, sessionCookie))
    }

    logger.info('Backfill de segmentos de transcripcion ejecutado', {
      actorId: auth.userId,
      failed: processed.filter((item) => !item.ok).length,
      succeeded: processed.filter((item) => item.ok).length,
    })

    return NextResponse.json({
      pending: await countPendingLessons(),
      processed,
      success: true,
    })
  } catch (error) {
    logger.error('Backfill de segmentos: fallo al procesar el lote', error)
    return NextResponse.json(
      { error: 'No se pudo reprocesar el lote de transcripciones', success: false },
      { status: 500 },
    )
  }
}

interface PostOptions {
  batchSize: number
  lessonId?: string
  lessonTitleContains?: string
}

async function resolvePostOptions(request: Request): Promise<PostOptions> {
  try {
    const body = (await request.json()) as {
      batchSize?: unknown
      lessonId?: unknown
      lessonTitleContains?: unknown
    }

    const requested = Number(body?.batchSize)
    const batchSize =
      Number.isFinite(requested) && requested > 0
        ? Math.min(Math.trunc(requested), MAX_BATCH_SIZE)
        : DEFAULT_BATCH_SIZE

    return {
      batchSize,
      lessonId: typeof body?.lessonId === 'string' ? body.lessonId : undefined,
      lessonTitleContains:
        typeof body?.lessonTitleContains === 'string' && body.lessonTitleContains.trim()
          ? body.lessonTitleContains.trim()
          : undefined,
    }
  } catch {
    return { batchSize: DEFAULT_BATCH_SIZE }
  }
}

interface ReprocessResult {
  lessonId: string
  lessonTitle: string | null
  ok: boolean
  reason?: string
}

/**
 * Reprocesa una lección reutilizando el endpoint de análisis de vídeo, que ya
 * concentra la subida a Gemini, el prompt con marcas de tiempo y la validación
 * de los segmentos. Duplicar esa lógica aquí la haría divergir.
 */
async function reprocessLesson(
  lesson: PendingLessonRow,
  sessionCookie: string,
): Promise<ReprocessResult> {
  const base = {
    lessonId: lesson.lesson_id,
    lessonTitle: lesson.lesson_title,
  }

  const resolved = resolveDownloadableVideoUrl(lesson)
  if ('reason' in resolved) {
    return { ...base, ok: false, reason: resolved.reason }
  }

  try {
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${origin}/api/admin/ai/process-video`, {
      body: JSON.stringify({ videoUrl: resolved.url }),
      headers: {
        'Content-Type': 'application/json',
        // Propaga la sesión del admin: el endpoint de análisis exige requireAdmin.
        ...(sessionCookie ? { cookie: sessionCookie } : {}),
      },
      method: 'POST',
    })

    if (!response.ok) {
      const reason =
        response.status === 401 || response.status === 403
          ? 'Sesion de administrador no propagada al analisis del video'
          : `El analisis del video fallo (${response.status})`
      return { ...base, ok: false, reason }
    }

    const result = (await response.json()) as {
      segments?: unknown
      summary?: string
      transcript?: string
    }

    if (!Array.isArray(result.segments) || result.segments.length === 0) {
      return { ...base, ok: false, reason: 'El modelo no devolvio segmentos con tiempos' }
    }

    // Se validan contra la duración REAL del vídeo antes de guardar: el modelo a
    // veces devuelve tiempos posteriores al final del vídeo (alucinación), y
    // guardarlos haría que SofLIA citara un momento inexistente.
    const validatedSegments = parseTranscriptSegments(
      result.segments,
      lesson.duration_seconds ?? undefined,
    )
    if (validatedSegments.length === 0) {
      return { ...base, ok: false, reason: 'Los segmentos devueltos no eran validos para la duracion del video' }
    }

    const supabase = createAdminClient()
    const { error } = await supabase
      .from('course_lessons')
      .update({
        transcript_content: result.transcript ?? undefined,
        transcript_segments: validatedSegments as never,
      })
      .eq('lesson_id', lesson.lesson_id)

    if (error) {
      return { ...base, ok: false, reason: 'No se pudo guardar la transcripcion' }
    }

    return { ...base, ok: true }
  } catch (error) {
    return {
      ...base,
      ok: false,
      reason: error instanceof Error ? error.message.slice(0, 160) : 'Error desconocido',
    }
  }
}

/**
 * Convierte una ruta de Storage (`bucket/carpeta/archivo.mp4`) en su URL pública
 * del proyecto Supabase de la aplicación.
 *
 * Los buckets de vídeo son públicos (`/object/public/...`), así que no hacen
 * falta credenciales ni URLs firmadas para descargarlos.
 */
function buildStoragePublicUrl(storagePath: string): string | null {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  if (!baseUrl) return null

  const normalized = storagePath.replace(/^\/+/, '')
  // Hace falta al menos "bucket/archivo": sin bucket la URL no es resoluble.
  if (!normalized.includes('/')) return null

  try {
    return new URL(
      `/storage/v1/object/public/${normalized}`,
      baseUrl,
    ).toString()
  } catch {
    return null
  }
}

/**
 * Compara un host rechazado contra los autorizados y señala el primer carácter
 * que difiere, con su código Unicode.
 *
 * Existe porque dos cadenas pueden verse idénticas y no serlo: al copiar un
 * dominio desde una consola o un panel web puede colarse un homóglifo (una `l`
 * que en realidad es otro punto de código). La comparación de la allowlist es
 * estricta A PROPÓSITO —relajarla permitiría a un dominio homóglifo hacerse pasar
 * por uno legítimo—, así que lo que hay que corregir es el valor, no la comparación.
 */
/** Longitud del prefijo comun entre dos cadenas. */
function commonPrefixLength(a: string, b: string): number {
  const max = Math.min(a.length, b.length)
  let index = 0
  while (index < max && a[index] === b[index]) index += 1
  return index
}

function describeHostMismatch(
  blockedHost: string | undefined,
  allowedHosts: readonly string[],
): Record<string, unknown> | null {
  if (!blockedHost) return null

  // Coincidencia exacta: el host SÍ está autorizado y el bloqueo viene de otra
  // causa (por ejemplo, que el proceso aun no recargo las variables de entorno).
  if (allowedHosts.includes(blockedHost)) {
    return {
      blockedHost,
      note: 'El host coincide exactamente con uno autorizado: el bloqueo no se debe al valor',
    }
  }

  // Se elige el host autorizado MÁS PARECIDO (mayor prefijo común), no el primero
  // de igual longitud: con varios hosts del mismo tamaño, comparar contra el que
  // no toca señalaría una diferencia falsa en el primer carácter.
  const candidate = [...allowedHosts]
    .map((host) => ({ host, score: commonPrefixLength(host, blockedHost) }))
    .sort((a, b) => b.score - a.score)[0]

  if (!candidate || candidate.score === 0) {
    return {
      blockedHost,
      note: 'Ningun host autorizado se parece a este: falta anadirlo a SAFE_FETCH_ALLOWED_HOSTS',
      valueToUse: blockedHost,
    }
  }

  const candidateHost = candidate.host
  for (let index = 0; index < blockedHost.length; index += 1) {
    if (blockedHost[index] === candidateHost[index]) continue

    return {
      atIndex: index,
      configuredChar: candidateHost[index],
      configuredCodePoint: `U+${(candidateHost.codePointAt(index) ?? 0).toString(16).toUpperCase().padStart(4, '0')}`,
      note: 'Los caracteres se ven iguales pero son distintos: reescribe el valor a mano',
      realChar: blockedHost[index],
      realCodePoint: `U+${(blockedHost.codePointAt(index) ?? 0).toString(16).toUpperCase().padStart(4, '0')}`,
      valueToUse: blockedHost,
    }
  }

  return null
}

/**
 * Hosts desde los que el análisis de vídeo puede descargar.
 *
 * Replica la allowlist que aplica `safeFetch`: los proyectos Supabase propios MÁS
 * los añadidos en `SAFE_FETCH_ALLOWED_HOSTS`. Es habitual que los vídeos vivan en
 * un proyecto Supabase distinto del de la aplicación; ese host debe declararse en
 * esa variable, no abrirse la descarga a cualquier destino (protección anti-SSRF).
 */
function getDownloadableHostnames(): string[] {
  const fromSupabaseUrls = [
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_URL,
  ]
    .map((value) => {
      if (!value) return null
      try {
        return new URL(value).hostname
      } catch {
        return null
      }
    })
    .filter((host): host is string => Boolean(host))

  const fromEnvAllowlist = (process.env.SAFE_FETCH_ALLOWED_HOSTS ?? '')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean)

  return [...fromSupabaseUrls.map((host) => host.toLowerCase()), ...fromEnvAllowlist]
}

/**
 * URL descargable del vídeo de la lección, o `null` si no la hay.
 *
 * `process-video` descarga con `safeFetch` y una allowlist restringida a los
 * hosts de Supabase (protección anti-SSRF deliberada: un admin no debe poder
 * hacer que el servidor descargue de un host arbitrario). Por eso sólo son
 * reprocesables los vídeos alojados en Supabase Storage: YouTube y Vimeo ni
 * están permitidos ni exponen el fichero para descarga directa.
 */
export function resolveDownloadableVideoUrl(lesson: {
  video_provider: string | null
  video_provider_id: string | null
}): { url: string } | { reason: string; blockedHost?: string } {
  const id = lesson.video_provider_id
  if (!id) return { reason: 'La leccion no tiene video asociado' }

  if (lesson.video_provider === 'youtube' || lesson.video_provider === 'vimeo') {
    return {
      reason: `Video alojado en ${lesson.video_provider}: no expone el archivo para descarga directa`,
    }
  }

  // Algunas lecciones guardan una ruta de Storage en vez de una URL completa
  // (p. ej. "course-videos/videos/archivo.mp4"): se reconstruye la URL pública
  // sobre el proyecto Supabase de la aplicación.
  if (!id.startsWith('http')) {
    const publicUrl = buildStoragePublicUrl(id)
    return publicUrl
      ? { url: publicUrl }
      : { reason: 'La ruta del video no se pudo resolver a una URL de Storage' }
  }

  let hostname: string
  try {
    hostname = new URL(id).hostname.toLowerCase()
  } catch {
    return { reason: 'La URL del video no es valida' }
  }

  // Cualquier proyecto Supabase es descargable (ver process-video): así no hay que
  // declarar a mano el project-ref de cada proyecto donde vivan los vídeos.
  if (hostname !== 'supabase.co' && !hostname.endsWith('.supabase.co')) {
    return {
      blockedHost: hostname,
      reason: `Host no soportado para descarga: ${hostname}. Solo se admiten videos en Supabase Storage`,
    }
  }

  return { url: id }
}
