import { deleteOptionalByIn } from './delete-helpers'
import type { CourseHierarchyIds, SupabaseClient } from './types'

export async function deleteAiWorkshopData(
  supabase: SupabaseClient,
  hierarchy: Pick<CourseHierarchyIds, 'activityIds' | 'conversationIds' | 'materialIds'>,
) {
  const { activityIds, conversationIds, materialIds } = hierarchy

  await deleteOptionalByIn(supabase, 'lia_user_feedback', 'conversation_id', conversationIds, {
    label: 'el feedback de conversaciones IA del taller',
  })
  await deleteOptionalByIn(supabase, 'lia_messages', 'conversation_id', conversationIds, {
    label: 'los mensajes de conversaciones IA del taller',
  })
  await deleteOptionalByIn(supabase, 'lia_activity_completions', 'conversation_id', conversationIds, {
    label: 'las completaciones de actividades IA del taller',
  })
  await deleteOptionalByIn(supabase, 'user_quiz_submissions', 'material_id', materialIds, {
    label: 'los intentos de quiz asociados a materiales del taller',
  })
  await deleteOptionalByIn(supabase, 'user_quiz_submissions', 'activity_id', activityIds, {
    label: 'los intentos de quiz asociados a actividades del taller',
  })
  await deleteOptionalByIn(supabase, 'lia_conversations', 'activity_id', activityIds, {
    label: 'las conversaciones IA asociadas a actividades del taller',
  })
  await deleteOptionalByIn(supabase, 'lia_common_questions', 'activity_id', activityIds, {
    label: 'las preguntas frecuentes IA asociadas a actividades del taller',
  })
}
