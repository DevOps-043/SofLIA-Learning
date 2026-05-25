import { AuthService } from '../../services/auth.service'

const EXPIRED_SESSION_CLEANUP_INTERVAL_MS = 15 * 60 * 1000
let lastExpiredSessionCleanupAt = 0
let expiredSessionCleanupPromise: Promise<void> | null = null

export function scheduleExpiredSessionCleanup(): void {
  const now = Date.now()

  if (
    expiredSessionCleanupPromise ||
    now - lastExpiredSessionCleanupAt < EXPIRED_SESSION_CLEANUP_INTERVAL_MS
  ) {
    return
  }

  lastExpiredSessionCleanupAt = now
  expiredSessionCleanupPromise = AuthService.clearExpiredSessions()
    .catch(() => undefined)
    .finally(() => {
      expiredSessionCleanupPromise = null
    })
}
