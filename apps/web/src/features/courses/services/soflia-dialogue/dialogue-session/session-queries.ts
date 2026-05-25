import type { CourseActivityContext } from '../../activity-submission.server.service'
import { DialogueRuntimeError } from '../dialogue-runtime.errors'
import { dialogueSessionsTable } from '../dialogue-tables'
import { activeDialogueStates } from './session-state'

export async function getActiveDialogueSession(input: {
  client: unknown
  context: CourseActivityContext
}) {
  const { data, error } = await dialogueSessionsTable(input.client)
    .select(SELECT_COLUMNS.soflia_dialogue_sessions)
    .eq('user_id', input.context.userId)
    .eq('activity_id', input.context.activity.activity_id)
    .eq('enrollment_id', input.context.enrollmentId)
    .in('state', activeDialogueStates)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new DialogueRuntimeError(
      'DIALOGUE_PERSISTENCE_FAILED',
      500,
      'No fue posible consultar la sesion de dialogo',
      { message: error.message },
    )
  }

  return data
}

export async function getLatestDialogueSession(input: {
  client: unknown
  context: CourseActivityContext
}) {
  const { data, error } = await dialogueSessionsTable(input.client)
    .select(SELECT_COLUMNS.soflia_dialogue_sessions)
    .eq('user_id', input.context.userId)
    .eq('activity_id', input.context.activity.activity_id)
    .eq('enrollment_id', input.context.enrollmentId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new DialogueRuntimeError(
      'DIALOGUE_PERSISTENCE_FAILED',
      500,
      'No fue posible consultar la sesion de dialogo',
      { message: error.message },
    )
  }

  return data
}
