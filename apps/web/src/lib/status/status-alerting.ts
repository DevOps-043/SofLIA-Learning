import 'server-only'

import {
  ServiceStatus,
  type StatusComponentKey,
} from '@aprende-y-aplica/shared'

import { createSystemNotification } from '@/features/notifications/services/auto-notifications-system-create.service'
import { logger } from '@/lib/logger'
import type { StatusCheckResult } from './checkers/types'
import { getPlatformAdminIds } from './get-platform-admins'

export const SYSTEM_STATUS_INCIDENT_TYPE = 'system_status_incident'
export const SYSTEM_STATUS_RECOVERED_TYPE = 'system_status_recovered'

// While a component stays degraded/down, admins get at most one reminder per
// bucket window (dedup_key collision silences every cron tick in between).
const REALERT_INTERVAL_HOURS = 4

export async function maybeAlertAdmins(
  componentKey: StatusComponentKey,
  previousStatus: ServiceStatus | null,
  currentResult: StatusCheckResult,
): Promise<void> {
  const isIncident = currentResult.status !== ServiceStatus.OPERATIONAL
  const isRecovery =
    currentResult.status === ServiceStatus.OPERATIONAL
    && previousStatus !== null
    && previousStatus !== ServiceStatus.OPERATIONAL

  if (!isIncident && !isRecovery) return

  const adminIds = await getPlatformAdminIds()
  if (adminIds.length === 0) {
    logger.warn('status.alerting.no_admins_found', { componentKey })
    return
  }

  const notificationType = isRecovery
    ? SYSTEM_STATUS_RECOVERED_TYPE
    : SYSTEM_STATUS_INCIDENT_TYPE
  const dedupKey = buildStatusDedupKey(componentKey, currentResult.status, isRecovery)

  // Deliberately NOT including errorDetail: raw provider responses may contain
  // sensitive fragments; the classification is enough to triage from the alert.
  const metadata = {
    componentKey,
    status: currentResult.status,
    errorClassification: currentResult.errorClassification,
    action_url: '/admin/system-status',
  }

  await Promise.all(
    adminIds.map((userId) =>
      createSystemNotification({
        userId,
        notificationType,
        dedupKey,
        isLocalized: true,
        metadata,
        logSuccess: 'status.alerting.notification_created',
        logError: 'status.alerting.notification_failed',
        logContext: { componentKey, status: currentResult.status },
      }),
    ),
  )
}

export function buildStatusDedupKey(
  componentKey: StatusComponentKey,
  status: ServiceStatus,
  isRecovery: boolean,
  now = Date.now(),
): string {
  if (isRecovery) {
    // Hour-scoped: fires once per recovery transition, but a same-hour flap
    // (down -> up -> down -> up) will not re-notify redundantly.
    const hourBucket = new Date(now).toISOString().slice(0, 13)
    return `system-status:${componentKey}:recovered:${hourBucket}`
  }

  const bucket = Math.floor(now / (REALERT_INTERVAL_HOURS * 3_600_000))
  return `system-status:${componentKey}:${status}:${bucket}`
}
