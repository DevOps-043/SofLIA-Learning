import { deleteByEqBatch, deleteByInBatch } from './delete-batches'
import type { SupabaseClient, WorkshopDeletionContext } from './types'

export async function deleteWorkshopForumData(
  supabase: SupabaseClient,
  context: WorkshopDeletionContext,
) {
  await deleteByInBatch(supabase, [
    { table: 'course_question_reactions', column: 'response_id', values: context.responseIds, label: 'las reacciones de respuestas del foro del taller', optional: true },
    { table: 'course_question_reactions', column: 'question_id', values: context.questionIds, label: 'las reacciones de preguntas del foro del taller', optional: true },
  ])
  await deleteByEqBatch(supabase, [
    { table: 'course_question_responses', column: 'course_id', value: context.workshopId, label: 'las respuestas del foro del taller', optional: true },
    { table: 'course_questions', column: 'course_id', value: context.workshopId, label: 'las preguntas del foro del taller', optional: true },
  ])
}
