import type { TranscodingJob, TranscodingJobStatus } from '../../hooks/useTranscodingJobStatus'

export interface JobsApiResponse {
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

export interface DispatchFailure {
  ok: false
  jobId: string
  reason?: string
  detail?: string
}

export interface ScanResponse {
  success: boolean
  totalFound: number
  alreadyDone: number
  queued: number
  invoked: number
  jobIds: string[]
  failures?: DispatchFailure[]
  error?: string
}

export interface DrainResponse {
  success: boolean
  invoked: number
  jobIds?: string[]
  failures?: DispatchFailure[]
  message?: string
  error?: string
}

export interface DiagnosticsResponse {
  transcodingEnabled: boolean
  netlifyUrl: string | null
  netlifyUrlSource: string | null
  hasTranscodingInternalSecret: boolean
  bgFunctionProbe: {
    reachable: boolean | null
    status: number | null
    error: string | null
  }
  summary: { healthy: boolean; problems: string[] }
}
