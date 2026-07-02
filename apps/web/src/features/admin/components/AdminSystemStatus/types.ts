import type {
  ServiceStatus,
  StatusComponentKey,
  StatusErrorClassification,
} from '@aprende-y-aplica/shared'

export interface AdminStatusCheck {
  id: number
  componentKey: StatusComponentKey
  status: ServiceStatus
  latencyMs: number
  errorClassification: StatusErrorClassification
  errorDetail: string | null
  triggeredBy: 'cron' | 'manual'
  checkedAt: string
}

export interface CircuitBreakerSnapshotView {
  name: string
  state: 'closed' | 'open' | 'half-open'
  failures: number
  successes: number
  total: number
  failureRate: number
  openedAt?: string
  nextAttemptAt?: string
}

export interface AdminStatusResponse {
  success: boolean
  checks: AdminStatusCheck[]
  circuitBreakers: CircuitBreakerSnapshotView[]
  generatedAt: string
}
