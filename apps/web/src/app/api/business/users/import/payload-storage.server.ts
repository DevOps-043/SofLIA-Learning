import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'

export const QUEUE_PAYLOADS_BUCKET =
  process.env.QUEUE_PAYLOADS_BUCKET || 'job-payloads'

export async function uploadBusinessUserImportPayload(params: {
  fileContent: string
  jobId: string
  organizationId: string
}): Promise<string> {
  const path = buildBusinessUserImportPayloadPath(params)
  const { error } = await createAdminClient()
    .storage
    .from(QUEUE_PAYLOADS_BUCKET)
    .upload(path, params.fileContent, {
      contentType: 'text/csv; charset=utf-8',
      upsert: true,
    })

  if (error) {
    throw new Error(`No se pudo guardar payload de importacion: ${error.message}`)
  }

  return path
}

export async function downloadBusinessUserImportPayload(
  filePath: string,
): Promise<string> {
  const { data, error } = await createAdminClient()
    .storage
    .from(QUEUE_PAYLOADS_BUCKET)
    .download(filePath)

  if (error || !data) {
    throw new Error(`No se pudo leer payload de importacion: ${error?.message ?? 'archivo no encontrado'}`)
  }

  return data.text()
}

function buildBusinessUserImportPayloadPath(params: {
  jobId: string
  organizationId: string
}): string {
  const safeJobId = params.jobId.replace(/[^a-zA-Z0-9:._-]/g, '_')
  return `business-users/${params.organizationId}/${safeJobId}.csv`
}
