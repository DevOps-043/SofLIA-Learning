import { logger as techDebtLogger } from '@/lib/utils/logger'
import { dialogueEventsTable } from './dialogue-tables'

export async function recordDialogueEvent(
  client: unknown,
  input: {
    activityId?: string | null
    eventType: string
    payload?: Record<string, unknown>
    sessionId?: string | null
    userId?: string | null
  },
) {
  const { error } = await dialogueEventsTable(client).insert({
    activity_id: input.activityId ?? null,
    event_type: input.eventType,
    payload: input.payload ?? {},
    session_id: input.sessionId ?? null,
    user_id: input.userId ?? null,
  })

  if (error) {
    techDebtLogger.error('[SofLIA Dialogue] Failed to record event', {
      eventType: input.eventType,
      message: error.message,
    })
  }
}
