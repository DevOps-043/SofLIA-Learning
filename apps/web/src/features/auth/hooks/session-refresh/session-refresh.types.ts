export interface UseSessionRefreshOptions {
  refreshBeforeExpiry?: number
  redirectOnExpiry?: boolean
  onRefresh?: () => void
  onExpiry?: () => void
}

export interface SessionRefreshResult {
  error?: string
  expired: boolean
  expiresAt?: string
}

export interface SessionStatusResult {
  authenticated: boolean
  accessExpiresAt?: string
}
