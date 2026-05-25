import {
  INACTIVITY_THRESHOLD_MINUTES,
  NEXT_ANALYSIS_INTERVAL_MINUTES,
} from './constants'
import type { AdminSupabaseClient } from './client'
import type { LessonTracking, TrackingProcessResult } from './types'

export async function processTracking(
  supabase: AdminSupabaseClient,
  tracking: LessonTracking,
): Promise<TrackingProcessResult> {
  const now = new Date()
  const thresholdMs = INACTIVITY_THRESHOLD_MINUTES * 60 * 1000

  if (tracking.lia_first_message_at && tracking.lia_last_message_at) {
    const result = await completeIfInactive(
      supabase,
      tracking,
      new Date(tracking.lia_last_message_at),
      now,
      thresholdMs,
      'lia_inactivity_5m',
    )
    if (result.completed) return result
  }

  if (tracking.last_activity_at) {
    const result = await completeIfInactive(
      supabase,
      tracking,
      new Date(tracking.last_activity_at),
      now,
      thresholdMs,
      'activity_inactivity_5m',
    )
    if (result.completed) return result
  }

  await scheduleNextAnalysis(supabase, tracking.id, now)
  return { completed: false }
}

async function completeIfInactive(
  supabase: AdminSupabaseClient,
  tracking: LessonTracking,
  lastActivity: Date,
  now: Date,
  thresholdMs: number,
  reason: string,
): Promise<TrackingProcessResult> {
  if (now.getTime() - lastActivity.getTime() < thresholdMs) {
    return { completed: false }
  }

  const completedAt = new Date(lastActivity.getTime() + thresholdMs)
  await supabase
    .from('lesson_tracking')
    .update({
      status: 'completed',
      completed_at: completedAt.toISOString(),
      end_trigger: reason,
      updated_at: now.toISOString(),
    })
    .eq('id', tracking.id)

  return { completed: true, reason }
}

async function scheduleNextAnalysis(
  supabase: AdminSupabaseClient,
  trackingId: string,
  now: Date,
) {
  const nextAnalysis = new Date(
    now.getTime() + NEXT_ANALYSIS_INTERVAL_MINUTES * 60 * 1000,
  )

  await supabase
    .from('lesson_tracking')
    .update({
      next_analysis_at: nextAnalysis.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('id', trackingId)
}
