import { collectConversationIds } from './collect-conversation-ids'
import { selectIdsByEq, selectIdsByIn } from './id-selectors'
import type { CourseHierarchyIds, SupabaseClient } from './types'

export async function collectCourseHierarchyIds(
  supabase: SupabaseClient,
  workshopId: string,
): Promise<CourseHierarchyIds> {
  const moduleIds = await selectIdsByEq(supabase, 'course_modules', 'module_id', 'course_id', workshopId, 'No se pudieron consultar los modulos del taller')
  const lessonIds = await selectIdsByIn(supabase, 'course_lessons', 'lesson_id', 'module_id', moduleIds, 'No se pudieron consultar las lecciones del taller')
  const materialIds = await selectIdsByIn(supabase, 'lesson_materials', 'material_id', 'lesson_id', lessonIds, 'No se pudieron consultar los materiales del taller')
  const activityIds = await selectIdsByIn(supabase, 'lesson_activities', 'activity_id', 'lesson_id', lessonIds, 'No se pudieron consultar las actividades del taller')
  const teamIds = await selectIdsByEq(supabase, 'work_teams', 'team_id', 'course_id', workshopId, 'No se pudieron consultar los equipos del taller', { ignoreMissingRelation: true })
  const certificateIds = await selectIdsByEq(supabase, 'user_course_certificates', 'certificate_id', 'course_id', workshopId, 'No se pudieron consultar los certificados del taller', { ignoreMissingRelation: true })
  const questionIds = await selectIdsByEq(supabase, 'course_questions', 'id', 'course_id', workshopId, 'No se pudieron consultar las preguntas del foro del taller', { ignoreMissingRelation: true })
  const responseIds = await selectIdsByEq(supabase, 'course_question_responses', 'id', 'course_id', workshopId, 'No se pudieron consultar las respuestas del foro del taller', { ignoreMissingRelation: true })
  const conversationIds = await collectConversationIds(
    supabase,
    workshopId,
    moduleIds,
    lessonIds,
    activityIds,
  )

  return {
    moduleIds,
    lessonIds,
    materialIds,
    activityIds,
    teamIds,
    certificateIds,
    conversationIds,
    questionIds,
    responseIds,
  }
}
