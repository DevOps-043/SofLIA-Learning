import { runDeleteEqPlans, runDeleteInPlans } from './delete-helpers'
import type { CourseHierarchyIds, SupabaseClient } from './types'

export async function deleteWorkshopForumRecords(
  supabase: SupabaseClient,
  workshopId: string,
  ids: CourseHierarchyIds,
) {
  await runDeleteInPlans(supabase, [
    { tableName: 'course_question_reactions', column: 'response_id', values: ids.responseIds, label: 'las reacciones de respuestas del foro del taller' },
    { tableName: 'course_question_reactions', column: 'question_id', values: ids.questionIds, label: 'las reacciones de preguntas del foro del taller' },
  ])

  await runDeleteEqPlans(supabase, [
    { tableName: 'course_question_responses', column: 'course_id', value: workshopId, label: 'las respuestas del foro del taller' },
    { tableName: 'course_questions', column: 'course_id', value: workshopId, label: 'las preguntas del foro del taller' },
    { tableName: 'course_reviews', column: 'course_id', value: workshopId, label: 'las resenas del taller' },
    { tableName: 'course_skills', column: 'course_id', value: workshopId, label: 'las habilidades del taller' },
  ])
}
