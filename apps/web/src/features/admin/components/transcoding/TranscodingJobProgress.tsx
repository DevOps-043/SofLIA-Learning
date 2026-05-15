'use client'

import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'

import {
  useTranscodingJobStatus,
  type TranscodingJob,
  type TranscodingJobStatus,
} from '../../hooks/useTranscodingJobStatus'

interface TranscodingJobProgressProps {
  jobId: string | null | undefined
  /** Called when the job reaches a terminal state. */
  onTerminal?: (job: TranscodingJob) => void
  /** Polling interval in ms.  Defaults to 5000. */
  pollIntervalMs?: number
  /** Compact mode renders inline (no card chrome).  Defaults to false. */
  compact?: boolean
}

const STATUS_COPY: Record<TranscodingJobStatus, { label: string; tone: string }> = {
  queued: { label: 'En cola', tone: 'text-[#6C757D]' },
  processing: { label: 'Procesando', tone: 'text-[#0A2540] dark:text-[#00D4B3]' },
  completed: { label: 'Completado', tone: 'text-[#10B981]' },
  failed: { label: 'Falló', tone: 'text-[#ef4444]' },
  skipped: { label: 'Omitido', tone: 'text-[#6C757D]' },
  disabled: { label: 'Transcoding desactivado', tone: 'text-[#6C757D]' },
}

function StatusIcon({ status }: { status: TranscodingJobStatus }) {
  if (status === 'queued') {
    return <ClockIcon className="h-4 w-4" />
  }
  if (status === 'processing') {
    return <ArrowPathIcon className="h-4 w-4 animate-spin" />
  }
  if (status === 'completed') {
    return <CheckCircleIcon className="h-4 w-4" />
  }
  if (status === 'failed') {
    return <ExclamationTriangleIcon className="h-4 w-4" />
  }
  return <ClockIcon className="h-4 w-4" />
}

export function TranscodingJobProgress({
  jobId,
  onTerminal,
  pollIntervalMs = 5000,
  compact = false,
}: TranscodingJobProgressProps) {
  const { job, error } = useTranscodingJobStatus({
    jobId,
    pollIntervalMs,
    onTerminal,
  })

  if (!jobId) return null

  if (error) {
    return (
      <div className="flex items-center gap-2 text-xs text-[#ef4444]">
        <ExclamationTriangleIcon className="h-4 w-4" />
        <span>No se pudo consultar el estado: {error}</span>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="flex items-center gap-2 text-xs text-[#6C757D] dark:text-white/60">
        <ArrowPathIcon className="h-4 w-4 animate-spin" />
        <span>Cargando estado del job…</span>
      </div>
    )
  }

  const copy = STATUS_COPY[job.status]
  const elapsedMs = job.started_at
    ? Date.now() - new Date(job.started_at).getTime()
    : 0
  const elapsedSeconds = Math.floor(elapsedMs / 1000)
  const elapsedLabel =
    elapsedSeconds < 60
      ? `${elapsedSeconds}s`
      : `${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s`

  if (compact) {
    return (
      <div className={`flex items-center gap-2 text-xs ${copy.tone}`}>
        <StatusIcon status={job.status} />
        <span className="font-medium">{copy.label}</span>
        {job.status === 'processing' && (
          <span className="text-[#6C757D] dark:text-white/60">· {elapsedLabel}</span>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[#E9ECEF] dark:border-white/10 bg-white dark:bg-[#0A0D12] p-3">
      <div className={`flex items-center gap-2 text-sm font-medium ${copy.tone}`}>
        <StatusIcon status={job.status} />
        <span>{copy.label}</span>
        {job.status === 'processing' && (
          <span className="ml-auto text-xs text-[#6C757D] dark:text-white/60">
            {elapsedLabel} transcurridos
          </span>
        )}
      </div>
      {job.status === 'failed' && job.error_message && (
        <p className="mt-2 text-xs text-[#ef4444] break-words">
          {job.error_message}
        </p>
      )}
      {job.status === 'completed' && job.result_url && (
        <p className="mt-2 text-xs text-[#10B981] truncate">
          HLS listo · {job.result_url.split('/').slice(-2).join('/')}
        </p>
      )}
    </div>
  )
}
