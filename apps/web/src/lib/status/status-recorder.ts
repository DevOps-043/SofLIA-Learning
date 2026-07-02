import 'server-only'

import type {
  ServiceStatus,
  StatusCheckTrigger,
  StatusComponentKey,
} from '@aprende-y-aplica/shared'

import { logger } from '@/lib/logger'
import { createAdminClient } from '@/lib/supabase/admin'
import type { StatusCheckResult } from './checkers/types'

interface StatusCheckInsert {
  component_key: string
  status: string
  latency_ms: number
  error_classification: string
  error_detail: string | null
  triggered_by: StatusCheckTrigger
  triggered_by_user_id: string | null
}

// system_status_checks is not yet in the auto-generated Database types; use the
// same narrow-client cast pattern as security-audit-log.ts until types are regenerated.
type StatusChecksClient = {
  from(table: 'system_status_checks'): {
    insert(payload: StatusCheckInsert): PromiseLike<{ error: { message: string } | null }>
    select(columns: 'status'): {
      eq(column: 'component_key', value: string): {
        order(column: 'checked_at', options: { ascending: boolean }): {
          limit(count: number): {
            maybeSingle(): PromiseLike<{
              data: { status: ServiceStatus } | null
              error: { message: string } | null
            }>
          }
        }
      }
    }
  }
}

export async function getPreviousStatus(
  componentKey: StatusComponentKey,
): Promise<ServiceStatus | null> {
  const supabase = createAdminClient() as unknown as StatusChecksClient
  const { data, error } = await supabase
    .from('system_status_checks')
    .select('status')
    .eq('component_key', componentKey)
    .order('checked_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    logger.warn('status.recorder.previous_status_failed', {
      componentKey,
      error: error.message,
    })
    return null
  }

  return data?.status ?? null
}

export async function recordStatusCheck(
  componentKey: StatusComponentKey,
  result: StatusCheckResult,
  triggeredBy: StatusCheckTrigger,
  triggeredByUserId?: string,
): Promise<void> {
  const supabase = createAdminClient() as unknown as StatusChecksClient
  const { error } = await supabase.from('system_status_checks').insert({
    component_key: componentKey,
    status: result.status,
    latency_ms: result.latencyMs,
    error_classification: result.errorClassification,
    error_detail: result.errorDetail,
    triggered_by: triggeredBy,
    triggered_by_user_id: triggeredByUserId ?? null,
  })

  if (error) {
    logger.error('status.recorder.insert_failed', {
      componentKey,
      status: result.status,
      error: error.message,
    })
  }
}
