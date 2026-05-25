import { createAdminClient } from '../calendar.service'
import { collectLessonIds } from './lesson-order.collect'
import { buildEntryForCreateProposal } from './lesson-order.create-entries'
import {
  loadCompletedLessonIds,
  loadLessonMetadata,
} from './lesson-order.metadata'
import { buildEntriesForExistingSessions } from './lesson-order.session-entries'
import type {
  OrderValidationResult,
  ProposedCreate,
  ProposedMove,
  StudySessionRow,
} from './lesson-order.types'
import { validateLessonOrderEntries } from './lesson-order.validation'

export type {
  OrderValidationResult,
  ProposedCreate,
  ProposedMove,
  SessionOrderEntry,
} from './lesson-order.types'
export { validateLessonOrderEntries } from './lesson-order.validation'

export async function validateStrictLessonOrder(params: {
  userId: string
  planId: string
  proposedMoves?: ProposedMove[]
  proposedCreates?: ProposedCreate[]
}): Promise<OrderValidationResult> {
  const supabase = createAdminClient()
  const { data: sessions, error } = await supabase
    .from('study_sessions')
    .select('id, plan_id, course_id, lesson_id, start_time, status, title, metrics')
    .eq('user_id', params.userId)
    .eq('plan_id', params.planId)

  if (error || !sessions) {
    return {
      valid: false,
      code: 'lesson_order_validation_failed',
      message:
        'No pude validar el orden de lecciones porque no fue posible cargar las sesiones del plan.',
    }
  }

  const createLessonIds = (params.proposedCreates || [])
    .flatMap((item) => item.lessonId ? [item.lessonId] : [])
  const allLessonIds = collectLessonIds(sessions as StudySessionRow[], createLessonIds)
  const lessonMetadataResult = await loadLessonMetadata(allLessonIds)
  if (!lessonMetadataResult.valid) return lessonMetadataResult

  const completedLessonIdsResult = await loadCompletedLessonIds(params.userId, allLessonIds)
  if (!completedLessonIdsResult.valid) return completedLessonIdsResult

  const entries = buildEntriesForExistingSessions({
    sessions: sessions as StudySessionRow[],
    lessonMetadata: lessonMetadataResult.metadata,
    completedLessonIds: completedLessonIdsResult.completedLessonIds,
    moveOverrides: new Map(
      (params.proposedMoves || []).map((move) => [move.sessionId, move.newStartTime]),
    ),
  })

  for (const createProposal of params.proposedCreates || []) {
    const createEntry = buildEntryForCreateProposal({
      createProposal,
      lessonMetadata: lessonMetadataResult.metadata,
      completedLessonIds: completedLessonIdsResult.completedLessonIds,
    })
    if (createEntry) entries.push(createEntry)
  }

  return validateLessonOrderEntries(entries)
}
