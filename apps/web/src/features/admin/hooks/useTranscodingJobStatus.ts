'use client'

import { useEffect, useRef, useState } from 'react'

export type TranscodingJobStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'skipped'
  | 'disabled'

export interface TranscodingJob {
  id: string
  status: TranscodingJobStatus
  result_path: string | null
  result_url: string | null
  error_message: string | null
  created_at: string
  started_at: string | null
  completed_at: string | null
}

interface UseTranscodingJobStatusOptions {
  /** Job id to poll.  When null/undefined the hook is inert. */
  jobId: string | null | undefined
  /** Poll interval in ms.  Defaults to 5000. */
  pollIntervalMs?: number
  /** Called once when the job reaches a terminal state. */
  onTerminal?: (job: TranscodingJob) => void
}

interface UseTranscodingJobStatusResult {
  job: TranscodingJob | null
  isLoading: boolean
  error: string | null
  isTerminal: boolean
  refetch: () => Promise<void>
}

const TERMINAL_STATUSES: TranscodingJobStatus[] = [
  'completed',
  'failed',
  'skipped',
  'disabled',
]

function isTerminalStatus(status: TranscodingJobStatus): boolean {
  return TERMINAL_STATUSES.includes(status)
}

/**
 * Polls the status of a transcoding job until it reaches a terminal state.
 * Backs off automatically — stops polling once the job is completed/failed.
 *
 * Uses an AbortController to cancel in-flight requests when the jobId
 * changes or the component unmounts, preventing race conditions where a
 * late response overwrites a fresher state.
 */
export function useTranscodingJobStatus({
  jobId,
  pollIntervalMs = 5000,
  onTerminal,
}: UseTranscodingJobStatusOptions): UseTranscodingJobStatusResult {
  const [job, setJob] = useState<TranscodingJob | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onTerminalRef = useRef(onTerminal)
  onTerminalRef.current = onTerminal

  const terminalNotifiedRef = useRef<string | null>(null)
  const fetchControllerRef = useRef<AbortController | null>(null)

  const fetchJob = async (id: string, signal: AbortSignal) => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/admin/upload/course-videos/status/${encodeURIComponent(id)}`,
        { signal, credentials: 'include' },
      )
      if (!response.ok) {
        throw new Error(`Status ${response.status}`)
      }
      const data = (await response.json()) as { job: TranscodingJob }
      if (signal.aborted) return
      setJob(data.job)
      setError(null)

      if (
        isTerminalStatus(data.job.status) &&
        terminalNotifiedRef.current !== data.job.id
      ) {
        terminalNotifiedRef.current = data.job.id
        onTerminalRef.current?.(data.job)
      }
    } catch (err) {
      if (signal.aborted) return
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      if (!signal.aborted) setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!jobId) {
      setJob(null)
      setError(null)
      return
    }

    terminalNotifiedRef.current = null
    const controller = new AbortController()
    fetchControllerRef.current = controller

    void fetchJob(jobId, controller.signal)

    const interval = window.setInterval(() => {
      if (job && isTerminalStatus(job.status)) {
        window.clearInterval(interval)
        return
      }
      void fetchJob(jobId, controller.signal)
    }, pollIntervalMs)

    return () => {
      controller.abort()
      window.clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, pollIntervalMs])

  const isTerminal = job ? isTerminalStatus(job.status) : false

  const refetch = async () => {
    if (!jobId) return
    const controller = new AbortController()
    fetchControllerRef.current?.abort()
    fetchControllerRef.current = controller
    await fetchJob(jobId, controller.signal)
  }

  return { job, isLoading, error, isTerminal, refetch }
}
