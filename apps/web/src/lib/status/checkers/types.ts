import type {
  ServiceStatus,
  StatusErrorClassification,
} from '@aprende-y-aplica/shared'

export interface StatusCheckResult {
  status: ServiceStatus
  latencyMs: number
  errorClassification: StatusErrorClassification
  errorDetail: string | null
}

export type StatusChecker = () => Promise<StatusCheckResult>

export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}
