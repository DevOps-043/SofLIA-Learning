import 'server-only'

import { createHash, randomUUID } from 'node:crypto'

import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'

import { currentDailyReportDate } from './daily-ai-report.date'
import type {
  DailyAiReportDocument,
  DailyAiReportInsert,
  DailyAiReportLookup,
  DailyAiReportPayload,
  DailyAiReportRecord,
  DailyAiReportRequest,
  DailyAiReportRow,
} from './daily-ai-report.types'

const TABLE = 'daily_ai_report_documents'
const BUCKET = 'ai-reports'

/** Marcador para el índice único: los informes de organización no tienen sujeto. */
const NO_SUBJECT = '00000000-0000-0000-0000-000000000000'

/**
 * Devuelve el PDF del día para un ámbito, generándolo solo la primera vez.
 *
 * Contrato: dentro del mismo día natural, la primera llamada ejecuta `generate()`
 * —que es la que consume tokens—, guarda el resultado y lo registra; las
 * siguientes descargan ese mismo archivo sin volver a llamar al modelo. Al día
 * siguiente la clave cambia y se genera uno nuevo.
 *
 * Nunca falla por culpa de la caché: si la lectura del registro o la descarga del
 * archivo fallan, se regenera en vez de dejar al usuario sin informe.
 */
export async function getOrCreateDailyAiReport(
  request: DailyAiReportRequest,
): Promise<DailyAiReportDocument> {
  const reportDate = currentDailyReportDate()
  const scopeKey = request.scopeKey ?? ''
  const supabase = createAdminClient()

  const existing = await findTodaysReport({ supabase, request, scopeKey, reportDate })

  const existingMetadataIsValid = existing
    ? !request.isMetadataValid || request.isMetadataValid(existing.report_payload)
    : false

  if (existing && existingMetadataIsValid) {
    const bytes = await downloadReport(supabase, existing.storage_path)

    if (bytes) {
      return {
        bytes,
        fileName: existing.file_name,
        reportDate: existing.report_date,
        reused: true,
        generatedAt: existing.created_at,
        locale: existing.locale,
        metadata: existing.report_payload ?? undefined,
        storagePath: existing.storage_path,
      }
    }

    // El registro existe pero el archivo no: se regenera y se sobrescribe.
    logger.warn('Daily AI report file missing in storage; regenerating', {
      reportType: request.reportType,
      storagePath: existing.storage_path,
    })
  } else if (existing) {
    logger.warn('Daily AI report metadata is missing or obsolete; regenerating', {
      reportType: request.reportType,
      reportDate,
    })
  }

  const payload = await request.generate()
  const storagePath = existing?.storage_path
    ?? buildStoragePath({ request, scopeKey, reportDate })
  const stored = await storeReport({
    supabase,
    storagePath,
    bytes: payload.bytes,
  })

  // Sin persistencia el usuario sí recibe su informe, pero el siguiente intento
  // del día volverá a generarlo: no se registra lo que no se pudo guardar.
  if (stored) {
    await registerReport({
      supabase,
      request,
      payload,
      scopeKey,
      reportDate,
      storagePath,
      existingId: existing?.id,
    })

    // En una carrera entre dos servidores, el indice unico decide el informe
    // canonico. Cada candidato usa una ruta distinta; el perdedor descarga el
    // ganador y elimina unicamente su archivo huerfano.
    const canonical = await findTodaysReport({ supabase, request, scopeKey, reportDate })
    if (canonical && canonical.storage_path !== storagePath) {
      await supabase.storage.from(BUCKET).remove([storagePath])
      const canonicalBytes = await downloadReport(supabase, canonical.storage_path)
      if (canonicalBytes) {
        return {
          ...toRecord(canonical, true),
          bytes: canonicalBytes,
        }
      }
    }
  }

  return {
    bytes: payload.bytes,
    fileName: payload.fileName,
    reportDate,
    reused: false,
    generatedAt: new Date().toISOString(),
    locale: request.locale,
    metadata: payload.metadata,
    storagePath,
  }
}

/** Consulta el ultimo informe persistido sin descargar el PDF. */
export async function getLatestDailyAiReportRecord(
  request: DailyAiReportLookup,
): Promise<DailyAiReportRecord | null> {
  const supabase = createAdminClient()
  const row = await findLatestReport({ supabase, request })
  if (!row) return null

  return toRecord(row, true)
}

/** Consulta el ultimo informe persistido y descarga exactamente ese PDF. */
export async function getLatestDailyAiReport(
  request: DailyAiReportLookup,
): Promise<DailyAiReportDocument | null> {
  const supabase = createAdminClient()
  const row = await findLatestReport({ supabase, request })
  if (!row) return null

  const bytes = await downloadReport(supabase, row.storage_path)
  if (!bytes) return null

  return { ...toRecord(row, true), bytes }
}

type SupabaseAdminClient = ReturnType<typeof createAdminClient>

async function findTodaysReport({
  supabase,
  request,
  scopeKey,
  reportDate,
}: {
  supabase: SupabaseAdminClient
  request: DailyAiReportRequest
  scopeKey: string
  reportDate: string
}): Promise<DailyAiReportRow | null> {
  const table = fromLoose<DailyAiReportRow, DailyAiReportInsert>(supabase, TABLE)
  let query = table
    .select('id, report_type, organization_id, subject_user_id, locale, scope_key, report_date, storage_path, file_name, byte_size, model_name, report_payload, generated_by_user_id, created_at')
    .eq('report_type', request.reportType)
    .eq('organization_id', request.organizationId)
    .eq('report_date', reportDate)

  query = request.onePerOrganizationDay
    ? query.eq('scope_key', scopeKey)
    : query.eq('locale', request.locale).eq('scope_key', scopeKey)

  query = request.subjectUserId
    ? query.eq('subject_user_id', request.subjectUserId)
    : query.is('subject_user_id', null)

  const { data, error } = await query.limit(1).maybeSingle()

  if (error) {
    logger.error('Daily AI report lookup failed', error)
    return null
  }

  return data
}

async function findLatestReport({
  supabase,
  request,
}: {
  supabase: SupabaseAdminClient
  request: DailyAiReportLookup
}): Promise<DailyAiReportRow | null> {
  const table = fromLoose<DailyAiReportRow, DailyAiReportInsert>(supabase, TABLE)
  let query = table
    .select('id, report_type, organization_id, subject_user_id, locale, scope_key, report_date, storage_path, file_name, byte_size, model_name, report_payload, generated_by_user_id, created_at')
    .eq('report_type', request.reportType)
    .eq('organization_id', request.organizationId)

  query = request.onePerOrganizationDay
    ? query.eq('scope_key', request.scopeKey ?? '')
    : query.eq('locale', request.locale).eq('scope_key', request.scopeKey ?? '')

  query = request.subjectUserId
    ? query.eq('subject_user_id', request.subjectUserId)
    : query.is('subject_user_id', null)

  const { data, error } = await query
    .order('report_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    logger.error('Latest daily AI report lookup failed', error)
    return null
  }

  return data
}

async function downloadReport(
  supabase: SupabaseAdminClient,
  storagePath: string,
): Promise<Uint8Array | null> {
  try {
    const { data, error } = await supabase.storage.from(BUCKET).download(storagePath)

    if (error || !data) {
      return null
    }

    return new Uint8Array(await data.arrayBuffer())
  } catch (error) {
    logger.error('Daily AI report download failed', error)
    return null
  }
}

async function storeReport({
  supabase,
  storagePath,
  bytes,
}: {
  supabase: SupabaseAdminClient
  storagePath: string
  bytes: Uint8Array
}): Promise<boolean> {
  try {
    // `upsert` cubre el caso de un registro huérfano cuyo archivo se regenera.
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, toArrayBuffer(bytes), {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (error) {
      logger.error('Daily AI report upload failed', error)
      return false
    }

    return true
  } catch (error) {
    logger.error('Daily AI report upload threw', error)
    return false
  }
}

async function registerReport({
  supabase,
  request,
  payload,
  scopeKey,
  reportDate,
  storagePath,
  existingId,
}: {
  supabase: SupabaseAdminClient
  request: DailyAiReportRequest
  payload: DailyAiReportPayload
  scopeKey: string
  reportDate: string
  storagePath: string
  existingId?: string
}): Promise<void> {
  const table = fromLoose<DailyAiReportRow, DailyAiReportInsert>(supabase, TABLE)
  // Dos peticiones simultaneas chocan contra el indice unico. Despues del
  // upsert, el llamador consulta y devuelve el registro canonico ganador.
  const values: DailyAiReportInsert = {
    report_type: request.reportType,
    organization_id: request.organizationId,
    subject_user_id: request.subjectUserId ?? null,
    locale: request.locale,
    scope_key: scopeKey,
    report_date: reportDate,
    storage_path: storagePath,
    file_name: payload.fileName,
    byte_size: payload.bytes.byteLength,
    model_name: payload.modelName ?? null,
    report_payload: payload.metadata ?? null,
    generated_by_user_id: request.generatedByUserId ?? null,
  }
  const { error } = existingId
    ? await table.update(values).eq('id', existingId)
    : await table.upsert(values, { ignoreDuplicates: true })

  if (error) {
    logger.error('Daily AI report registration failed', error)
  }
}

function toRecord(row: DailyAiReportRow, reused: boolean): DailyAiReportRecord {
  return {
    fileName: row.file_name,
    reportDate: row.report_date,
    reused,
    generatedAt: row.created_at,
    locale: row.locale,
    metadata: row.report_payload ?? undefined,
    storagePath: row.storage_path,
  }
}

function buildStoragePath({
  request,
  scopeKey,
  reportDate,
}: {
  request: DailyAiReportRequest
  scopeKey: string
  reportDate: string
}): string {
  // El scopeKey puede traer filtros arbitrarios, así que se resume en un hash
  // corto para mantener la ruta acotada y sin caracteres problemáticos.
  const scopeHash = createHash('sha256').update(scopeKey).digest('hex').slice(0, 12)
  const subject = request.subjectUserId ?? NO_SUBJECT

  return `${request.organizationId}/${request.reportType}/${reportDate}/${subject}-${request.locale}-${scopeHash}-${randomUUID()}.pdf`
}

/** Copia los bytes a un ArrayBuffer propio: el SDK de Storage no acepta vistas. */
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)
  return buffer
}
