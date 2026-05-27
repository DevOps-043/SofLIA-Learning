import type { TranscodingJobStatus } from '../../hooks/useTranscodingJobStatus'
import type { DiagnosticsResponse, DrainResponse, JobsApiResponse, ScanResponse } from './types'

export async function fetchDiagnostics(): Promise<DiagnosticsResponse> {
  const response = await fetch('/api/admin/transcoding/diagnostics', {
    credentials: 'include',
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

export async function fetchTranscodingJobs(statusFilter: TranscodingJobStatus | 'all') {
  const params = new URLSearchParams({ limit: '100' })
  if (statusFilter !== 'all') params.set('status', statusFilter)
  const response = await fetch(`/api/admin/transcoding/jobs?${params}`, {
    credentials: 'include',
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return (await response.json()) as JobsApiResponse
}

export async function scanAndQueueVideos(): Promise<ScanResponse> {
  const response = await fetch('/api/admin/transcoding/scan-and-queue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ bucket: 'course-videos', folder: 'videos', concurrency: 10 }),
  })
  return response.json()
}

export async function drainTranscodingQueue(): Promise<DrainResponse> {
  const response = await fetch('/api/admin/transcoding/drain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ concurrency: 10 }),
  })
  return response.json()
}

export async function queueLegacyVideos(): Promise<ScanResponse> {
  const response = await fetch('/api/admin/transcoding/scan-and-queue-legacy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    // concurrency: 1 — encola todo, dispara solo 1 función background de inmediato.
    // El drain automático procesa el resto de la cola de a uno para minimizar costo.
    body: JSON.stringify({ concurrency: 1 }),
  })
  return response.json()
}

export async function reprocessTranscodingJob(sourcePath: string, bucket: string, contentType: string) {
  await fetch('/api/admin/transcoding/reprocess', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ sourcePath, bucket, contentType }),
  })
}
