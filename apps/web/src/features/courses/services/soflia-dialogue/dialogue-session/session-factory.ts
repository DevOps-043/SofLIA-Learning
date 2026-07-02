import {
  terminalDialogueStates,
  type DialogueActivityConfig,
} from '../../../types/dialogue-runtime'
import type { CourseActivityContext } from '../../activity-submission.server.service'
import { DialogueRuntimeError } from '../dialogue-runtime.errors'
import { dialogueSessionsTable } from '../dialogue-tables'
import { resolveDialogueAttempt } from './attempts'
import { getDialogueSessionById } from './session-by-id'
import {
  getActiveDialogueSession,
  getLatestDialogueSession,
} from './session-queries'
import { throwDialogueSessionInsertError } from './session-insert-error'
import { SELECT_COLUMNS } from '@/lib/supabase/select-types';

export { getDialogueSessionById, getActiveDialogueSession, getLatestDialogueSession }

export async function getOrCreateDialogueSession(input: {
  client: unknown
  config: DialogueActivityConfig
  context: CourseActivityContext
}) {
  const activeSession = await getActiveDialogueSession(input)
  if (activeSession) {
    return activeSession
  }

  return createDialogueSession(input)
}

export async function createDialogueSession(input: {
  client: unknown
  config: DialogueActivityConfig
  context: CourseActivityContext
}) {
  // Solo las sesiones que llegaron a un estado terminal consumen intento. Las sesiones
  // abandonadas o bloqueadas por fallos técnicos del evaluador no son intentos reales
  // del estudiante y no deben dejarlo fuera de la actividad.
  const { count, error: countError } = await dialogueSessionsTable(input.client)
    .select('session_id', { count: 'exact', head: true })
    .eq('user_id', input.context.userId)
    .eq('activity_id', input.context.activity.activity_id)
    .eq('enrollment_id', input.context.enrollmentId)
    .in('state', terminalDialogueStates)

  if (countError) {
    throw new DialogueRuntimeError(
      'DIALOGUE_PERSISTENCE_FAILED',
      500,
      'No fue posible validar los intentos del dialogo',
      { message: countError.message },
    )
  }

  const attemptDecision = resolveDialogueAttempt(count || 0)

  if (attemptDecision.kind === 'limit_reached') {
    throw new DialogueRuntimeError(
      'DIALOGUE_ATTEMPT_LIMIT_REACHED',
      409,
      'Se alcanzo el limite de 3 intentos para esta actividad',
    )
  }

  return insertDialogueSession(input)
}

async function insertDialogueSession(input: {
  client: unknown
  config: DialogueActivityConfig
  context: CourseActivityContext
}) {
  const { data, error } = await dialogueSessionsTable(input.client)
    .insert({
      activity_config_snapshot: input.config,
      activity_id: input.context.activity.activity_id,
      course_id: input.context.courseId,
      criteria_missing: input.config.successCriteria.map((criterion) => criterion.id),
      enrollment_id: input.context.enrollmentId,
      lesson_id: input.context.lessonId,
      organization_id: input.context.organizationId,
      prompt_version:
        input.config.versioning.promptVersion ||
        input.config.evaluator.promptVersion,
      rubric_version: input.config.versioning.rubricVersion,
      schema_version: input.config.schemaVersion,
      state: 'START',
      user_id: input.context.userId,
    })
    .select(SELECT_COLUMNS.soflia_dialogue_sessions)
    .single()

  if (error || !data) {
    throwDialogueSessionInsertError(error?.message)
  }

  return data
}
