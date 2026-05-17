import type { LoadProfileName, LoadStage } from './config'

export interface RequestMetric {
  runId: string
  profile: LoadProfileName | 'manual'
  flow: string
  name: string
  method: string
  url: string
  status: number
  ok: boolean
  durationMs: number
  bytes: number
  startedAt: string
  endedAt: string
  traceId?: string
  userIndex?: number
  error?: string
  responseText?: string
}

export interface MetricsSnapshot {
  runId: string
  label: string
  capturedAt: string
  app?: unknown
  supabase?: unknown
  netlify?: unknown
  warnings: string[]
}

export interface RunSummary {
  runId: string
  profile: LoadProfileName
  startedAt: string
  endedAt: string
  baseUrl: string
  stages: LoadStage[]
  maxVus: number
  aiRatio: number
  aborted: boolean
  abortReason?: string
  metricsFile: string
  snapshotsFile: string
}

export interface EndpointStats {
  flow: string
  name: string
  method: string
  url: string
  count: number
  ok: number
  failed: number
  status4xx: number
  status401: number
  status5xx: number
  status429: number
  edge403Html: number
  timeouts: number
  bytes: number
  minMs: number
  maxMs: number
  avgMs: number
  p50Ms: number
  p90Ms: number
  p95Ms: number
  p99Ms: number
}
