import type { CourseActivityContext } from '../../activity-submission.server.service'
import { DialogueRuntimeError } from '../dialogue-runtime.errors'
import { dialogueSessionsTable } from '../dialogue-tables'

export async function getDialogueSessionById(input: {
  client: unknown
  context: CourseActivityContext
  sessionId: string
}) {
  const { data, error } = await dialogueSessionsTable(input.client)
    .select(SELECT_COLUMNS.soflia_dialogue_sessions)
    .eq('session_id', input.sessionId)
    .eq('user_id', input.context.userId)
    .eq('activity_id', input.context.activity.activity_id)
    .eq('enrollment_id', input.context.enrollmentId)
    .maybeSingle()

  if (error) {
    throw new DialogueRuntimeError(
      'DIALOGUE_PERSISTENCE_FAILED',
      500,
      'No fue posible consultar la sesion de dialogo',
      { message: error.message },
    )
  }

  if (!data) {
    throw new DialogueRuntimeError(
      'DIALOGUE_SESSION_NOT_FOUND',
      404,
      'Sesion de dialogo no encontrada',
    )
  }

  return data
}
