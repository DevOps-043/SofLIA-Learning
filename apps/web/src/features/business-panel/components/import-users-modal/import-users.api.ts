import type { ImportResult } from './import-users.types'

const IMPORT_JOB_POLL_INTERVAL_MS = 1500
const IMPORT_JOB_MAX_POLLS = 40

export async function downloadImportUsersTemplate() {
  const response = await fetch('/api/business/users/template', { credentials: 'include' })
  if (!response.ok) throw new Error('download_failed')

  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'plantilla-importacion-usuarios.csv'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  window.URL.revokeObjectURL(url)
}

export async function importUsersFile(file: File): Promise<ImportResult> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/business/users/import', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })
  const data: unknown = await response.json()

  if (!response.ok) throw new Error(readError(data) ?? 'processFile')

  const queuedStatusUrl = readQueuedStatusUrl(data)
  if (queuedStatusUrl) {
    return pollImportJob(queuedStatusUrl)
  }

  const result = readResult(data)
  if (!result) throw new Error('invalidResponse')

  return result
}

async function pollImportJob(jobStatusUrl: string): Promise<ImportResult> {
  for (let attempt = 0; attempt < IMPORT_JOB_MAX_POLLS; attempt += 1) {
    if (attempt > 0) await delay(IMPORT_JOB_POLL_INTERVAL_MS)

    const response = await fetch(jobStatusUrl, { credentials: 'include' })
    const data: unknown = await response.json().catch(() => null)

    if (!response.ok) throw new Error(readError(data) ?? 'processFile')

    const job = readJob(data)
    if (!job) throw new Error('invalidResponse')

    const status = readString(job.status)
    if (status === 'succeeded') {
      const result = normalizeImportResult(job.result)
      if (!result) throw new Error('invalidResponse')
      return result
    }

    if (
      status === 'dead_letter' ||
      status === 'failed' ||
      status === 'publish_failed'
    ) {
      throw new Error(readString(job.error) ?? 'processFile')
    }
  }

  throw new Error('timeout')
}

function readQueuedStatusUrl(data: unknown): string | null {
  if (!isRecord(data) || data.queued !== true) return null
  return readString(data.jobStatusUrl)
}

function readResult(data: unknown): ImportResult | null {
  if (!isRecord(data) || data.success !== true) return null
  return normalizeImportResult(data.result)
}

function readJob(data: unknown): Record<string, unknown> | null {
  if (!isRecord(data) || data.success !== true || !isRecord(data.job)) {
    return null
  }

  return data.job
}

function normalizeImportResult(value: unknown): ImportResult | null {
  if (!isRecord(value)) return null

  const imported = readNumber(value.imported)
  const errors = readNumber(value.errors)
  const total = readNumber(value.total)
  if (imported === null || errors === null || total === null) return null

  return {
    imported,
    errors,
    total,
    details: normalizeImportErrors(value.details),
  }
}

function normalizeImportErrors(
  value: unknown,
): ImportResult['details'] {
  if (!Array.isArray(value)) return []

  return value.flatMap((item) => {
    if (!isRecord(item)) return []

    const row = readNumber(item.row)
    const error = readString(item.error)
    const data = isRecord(item.data) ? item.data : {}

    return row !== null && error ? [{ row, error, data }] : []
  })
}

function readError(data: unknown): string | null {
  if (!isRecord(data)) return null
  return readString(data.error)
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, milliseconds)
  })
}
