'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PlayCircleIcon,
  ServerStackIcon,
} from '@heroicons/react/24/outline'

import type { TranscodingJob, TranscodingJobStatus } from '../hooks/useTranscodingJobStatus'

interface JobsApiResponse {
  jobs: Array<TranscodingJob & {
    source_path: string
    source_url: string
    bucket: string
    content_type: string
    size_bytes: number | null
  }>
  total: number
  summary: Record<TranscodingJobStatus, number>
}

interface ScanResponse {
  success: boolean
  totalFound: number
  alreadyDone: number
  queued: number
  invoked: number
  jobIds: string[]
  error?: string
}

interface DrainResponse {
  success: boolean
  invoked: number
  message?: string
  error?: string
}

const REFRESH_INTERVAL_MS = 5000

const STATUS_META: Record<
  TranscodingJobStatus,
  { label: string; tone: string; bg: string; border: string }
> = {
  queued:     { label: 'En cola',    tone: 'text-[#6C757D]',  bg: 'bg-[#E9ECEF]/60 dark:bg-white/5',                  border: 'border-[#E9ECEF] dark:border-white/10' },
  processing: { label: 'Procesando', tone: 'text-[#0A2540] dark:text-[#00D4B3]', bg: 'bg-[#00D4B3]/10',               border: 'border-[#00D4B3]/40' },
  completed:  { label: 'Completado', tone: 'text-[#10B981]',  bg: 'bg-[#10B981]/10',                                  border: 'border-[#10B981]/40' },
  failed:     { label: 'Falló',      tone: 'text-[#ef4444]',  bg: 'bg-[#ef4444]/10',                                  border: 'border-[#ef4444]/40' },
  skipped:    { label: 'Omitido',    tone: 'text-[#6C757D]',  bg: 'bg-[#6C757D]/10',                                  border: 'border-[#6C757D]/30' },
  disabled:   { label: 'Desactivado',tone: 'text-[#6C757D]',  bg: 'bg-[#6C757D]/10',                                  border: 'border-[#6C757D]/30' },
}

function formatSize(bytes: number | null): string {
  if (!bytes || bytes <= 0) return '—'
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatElapsed(startIso: string | null, endIso: string | null): string {
  if (!startIso) return '—'
  const start = new Date(startIso).getTime()
  const end = endIso ? new Date(endIso).getTime() : Date.now()
  const seconds = Math.floor((end - start) / 1000)
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

export function AdminTranscodingPage() {
  const [data, setData] = useState<JobsApiResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<TranscodingJobStatus | 'all'>('all')

  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null)

  const [isDraining, setIsDraining] = useState(false)
  const [drainResult, setDrainResult] = useState<DrainResponse | null>(null)

  const fetchControllerRef = useRef<AbortController | null>(null)

  const fetchJobs = useCallback(async () => {
    fetchControllerRef.current?.abort()
    const controller = new AbortController()
    fetchControllerRef.current = controller

    try {
      const params = new URLSearchParams({ limit: '100' })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const response = await fetch(`/api/admin/transcoding/jobs?${params}`, {
        signal: controller.signal,
        credentials: 'include',
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const body = (await response.json()) as JobsApiResponse
      if (controller.signal.aborted) return
      setData(body)
      setError(null)
    } catch (err) {
      if (controller.signal.aborted) return
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      if (!controller.signal.aborted) setIsLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    void fetchJobs()
    const interval = window.setInterval(fetchJobs, REFRESH_INTERVAL_MS)
    return () => {
      window.clearInterval(interval)
      fetchControllerRef.current?.abort()
    }
  }, [fetchJobs])

  const triggerScan = async () => {
    setIsScanning(true)
    setScanResult(null)
    try {
      const response = await fetch('/api/admin/transcoding/scan-and-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bucket: 'course-videos', folder: 'videos', concurrency: 3 }),
      })
      const body = (await response.json()) as ScanResponse
      setScanResult(body)
      if (body.success) await fetchJobs()
    } catch (err) {
      setScanResult({
        success: false,
        totalFound: 0,
        alreadyDone: 0,
        queued: 0,
        invoked: 0,
        jobIds: [],
        error: err instanceof Error ? err.message : 'Error',
      })
    } finally {
      setIsScanning(false)
    }
  }

  const triggerDrain = async () => {
    setIsDraining(true)
    setDrainResult(null)
    try {
      const response = await fetch('/api/admin/transcoding/drain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ concurrency: 3 }),
      })
      const body = (await response.json()) as DrainResponse
      setDrainResult(body)
      if (body.success) await fetchJobs()
    } catch (err) {
      setDrainResult({
        success: false,
        invoked: 0,
        error: err instanceof Error ? err.message : 'Error',
      })
    } finally {
      setIsDraining(false)
    }
  }

  const reprocessJob = async (sourcePath: string, bucket: string, contentType: string) => {
    try {
      await fetch('/api/admin/transcoding/reprocess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sourcePath, bucket, contentType }),
      })
      await fetchJobs()
    } catch {
      // surface via auto-refresh; row will show failed if it persists
    }
  }

  const summary = data?.summary
  const tiles = useMemo(() => {
    if (!summary) return null
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        {(Object.keys(STATUS_META) as TranscodingJobStatus[]).map((key) => {
          const meta = STATUS_META[key]
          return (
            <div
              key={key}
              className={`rounded-xl border ${meta.border} ${meta.bg} p-4`}
            >
              <p className={`text-xs uppercase tracking-wide font-semibold ${meta.tone}`}>
                {meta.label}
              </p>
              <p className={`text-2xl font-bold mt-1 ${meta.tone}`}>
                {summary[key]}
              </p>
            </div>
          )
        })}
      </div>
    )
  }, [summary])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <ServerStackIcon className="h-7 w-7 text-[#0A2540] dark:text-[#00D4B3]" />
          <h1 className="text-2xl font-bold text-[#0A2540] dark:text-white">
            Transcoding de video
          </h1>
        </div>
        <p className="text-sm text-[#6C757D] dark:text-white/60">
          Procesamiento HLS adaptativo de videos de cursos. Los jobs se ejecutan
          como Netlify Background Functions (hasta 15 minutos cada uno).
        </p>
      </header>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          type="button"
          onClick={triggerScan}
          disabled={isScanning}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0A2540] hover:bg-[#0A2540]/90 text-white px-4 py-2 text-sm font-medium transition disabled:opacity-50"
        >
          {isScanning ? (
            <ArrowPathIcon className="h-4 w-4 animate-spin" />
          ) : (
            <PlayCircleIcon className="h-4 w-4" />
          )}
          Escanear y encolar pendientes
        </button>
        <button
          type="button"
          onClick={triggerDrain}
          disabled={isDraining}
          className="inline-flex items-center gap-2 rounded-xl border border-[#0A2540] text-[#0A2540] dark:border-white/20 dark:text-white px-4 py-2 text-sm font-medium transition disabled:opacity-50 hover:bg-[#0A2540]/5 dark:hover:bg-white/5"
        >
          {isDraining ? (
            <ArrowPathIcon className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowPathIcon className="h-4 w-4" />
          )}
          Procesar siguientes 3 en cola
        </button>
        <button
          type="button"
          onClick={() => void fetchJobs()}
          className="ml-auto text-xs text-[#6C757D] dark:text-white/60 hover:text-[#0A2540] dark:hover:text-white"
        >
          Refrescar ahora
        </button>
      </div>

      {scanResult && (
        <div
          className={`mb-4 rounded-xl border p-3 text-sm ${
            scanResult.success
              ? 'border-[#10B981]/40 bg-[#10B981]/10 text-[#10B981]'
              : 'border-[#ef4444]/40 bg-[#ef4444]/10 text-[#ef4444]'
          }`}
        >
          {scanResult.success ? (
            <p>
              Encontrados <strong>{scanResult.totalFound}</strong> videos —{' '}
              <strong>{scanResult.alreadyDone}</strong> ya completados,{' '}
              <strong>{scanResult.queued}</strong> encolados,{' '}
              <strong>{scanResult.invoked}</strong> disparados ahora.
            </p>
          ) : (
            <p>Error: {scanResult.error}</p>
          )}
        </div>
      )}

      {drainResult && (
        <div className="mb-4 rounded-xl border border-[#0A2540]/20 dark:border-white/10 bg-[#0A2540]/5 dark:bg-white/5 p-3 text-sm text-[#0A2540] dark:text-white/80">
          {drainResult.success
            ? drainResult.message ?? `Disparados ${drainResult.invoked} nuevos jobs.`
            : `Error: ${drainResult.error}`}
        </div>
      )}

      {tiles}

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs uppercase font-semibold text-[#6C757D] dark:text-white/60">
          Filtrar:
        </span>
        {(['all', ...Object.keys(STATUS_META)] as Array<TranscodingJobStatus | 'all'>).map(
          (key) => {
            const isActive = statusFilter === key
            const label = key === 'all' ? 'Todos' : STATUS_META[key].label
            return (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={`text-xs px-3 py-1 rounded-full border transition ${
                  isActive
                    ? 'bg-[#0A2540] text-white border-[#0A2540]'
                    : 'border-[#E9ECEF] dark:border-white/10 text-[#6C757D] dark:text-white/70 hover:border-[#0A2540]/40'
                }`}
              >
                {label}
              </button>
            )
          },
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#E9ECEF] dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#F8FAFC] dark:bg-white/5 text-[#6C757D] dark:text-white/60 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Video</th>
                <th className="px-4 py-3 text-left font-semibold">Estado</th>
                <th className="px-4 py-3 text-left font-semibold">Tamaño</th>
                <th className="px-4 py-3 text-left font-semibold">Duración</th>
                <th className="px-4 py-3 text-left font-semibold">Creado</th>
                <th className="px-4 py-3 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9ECEF] dark:divide-white/10">
              {isLoading && !data ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[#6C757D] dark:text-white/60">
                    <ArrowPathIcon className="h-5 w-5 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[#ef4444]">
                    Error: {error}
                  </td>
                </tr>
              ) : !data || data.jobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[#6C757D] dark:text-white/60">
                    No hay jobs para mostrar.
                  </td>
                </tr>
              ) : (
                data.jobs.map((job) => {
                  const meta = STATUS_META[job.status]
                  return (
                    <tr key={job.id} className="hover:bg-[#F8FAFC] dark:hover:bg-white/5">
                      <td className="px-4 py-3 max-w-md">
                        <p className="text-[#0A2540] dark:text-white text-xs truncate" title={job.source_path}>
                          {job.source_path}
                        </p>
                        {job.error_message && (
                          <p className="text-[#ef4444] text-xs mt-1 break-words">
                            {job.error_message}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${meta.tone}`}>
                          {job.status === 'processing' && <ArrowPathIcon className="h-3 w-3 animate-spin" />}
                          {job.status === 'completed' && <CheckCircleIcon className="h-3 w-3" />}
                          {job.status === 'failed' && <ExclamationTriangleIcon className="h-3 w-3" />}
                          {(job.status === 'queued' || job.status === 'skipped' || job.status === 'disabled') && (
                            <ClockIcon className="h-3 w-3" />
                          )}
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#6C757D] dark:text-white/60">
                        {formatSize(job.size_bytes)}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#6C757D] dark:text-white/60">
                        {formatElapsed(job.started_at, job.completed_at)}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#6C757D] dark:text-white/60">
                        {new Date(job.created_at).toLocaleString('es-MX', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {(job.status === 'failed' || job.status === 'completed') && (
                          <button
                            type="button"
                            onClick={() =>
                              void reprocessJob(job.source_path, job.bucket, job.content_type)
                            }
                            className="text-xs text-[#0A2540] dark:text-[#00D4B3] hover:underline"
                          >
                            Reprocesar
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 text-xs text-[#6C757D] dark:text-white/50">
        La tabla se refresca automáticamente cada 5 segundos.
      </p>
    </div>
  )
}
