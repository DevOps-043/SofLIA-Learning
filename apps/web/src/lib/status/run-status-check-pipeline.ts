import 'server-only'

import type {
  StatusCheckTrigger,
  StatusComponentKey,
} from '@aprende-y-aplica/shared'

import { STATUS_CHECKERS } from './checkers'
import type { StatusCheckResult } from './checkers/types'
import { maybeAlertAdmins } from './status-alerting'
import { getPreviousStatus, recordStatusCheck } from './status-recorder'

// Single orchestration path shared by the cron job and the admin manual trigger:
// run checker -> detect transition -> persist -> alert admins if needed.
export async function runStatusCheckPipeline(
  componentKey: StatusComponentKey,
  triggeredBy: StatusCheckTrigger,
  triggeredByUserId?: string,
): Promise<StatusCheckResult> {
  const checker = STATUS_CHECKERS[componentKey]
  const [previousStatus, result] = await Promise.all([
    getPreviousStatus(componentKey),
    checker(),
  ])

  await recordStatusCheck(componentKey, result, triggeredBy, triggeredByUserId)
  await maybeAlertAdmins(componentKey, previousStatus, result)

  return result
}
