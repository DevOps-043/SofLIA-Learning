export enum ServiceStatus {
  OPERATIONAL = 'operational',
  DEGRADED = 'degraded',
  DOWN = 'down',
}

export enum StatusComponentKey {
  GEMINI_AI = 'gemini_ai',
  DATABASE = 'database',
  AUTH = 'auth',
}

// Admin-only detail. Never exposed through the public status API.
export enum StatusErrorClassification {
  NONE = 'none',
  TIMEOUT = 'timeout',
  BILLING_QUOTA = 'billing_quota',
  GENERIC_OUTAGE = 'generic_outage',
  LATENCY_DEGRADED = 'latency_degraded',
  AUTH_FAILURE = 'auth_failure',
  UNKNOWN = 'unknown',
}

export type StatusCheckTrigger = 'cron' | 'manual'

export interface PublicStatusComponent {
  key: StatusComponentKey
  status: ServiceStatus
  updatedAt: string | null
}

export interface DailyUptimeBucket {
  date: string
  status: ServiceStatus | 'no_data'
  checksTotal: number
  checksFailed: number
}

export interface PublicStatusResponse {
  overallStatus: ServiceStatus
  components: PublicStatusComponent[]
  uptimeDays: Record<StatusComponentKey, DailyUptimeBucket[]>
  generatedAt: string
}

export interface AdminStatusCheckRow {
  id: number
  componentKey: StatusComponentKey
  status: ServiceStatus
  latencyMs: number
  errorClassification: StatusErrorClassification
  errorDetail: string | null
  triggeredBy: StatusCheckTrigger
  checkedAt: string
}
