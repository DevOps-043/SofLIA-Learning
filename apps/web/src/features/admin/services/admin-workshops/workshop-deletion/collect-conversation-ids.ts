import { selectIdsByEq, selectIdsByIn } from './id-selectors'
import type { SupabaseClient } from './types'

async function appendConversationIdsByIn(
  supabase: SupabaseClient,
  target: Set<string>,
  column: 'module_id' | 'lesson_id' | 'activity_id',
  values: string[],
  errorMessage: string,
): Promise<void> {
  const conversationIds = await selectIdsByIn(
    supabase,
    'lia_conversations',
    'conversation_id',
    column,
    values,
    errorMessage,
    { ignoreMissingRelation: true },
  )
  conversationIds.forEach((conversationId) => target.add(conversationId))
}

export async function collectConversationIds(
  supabase: SupabaseClient,
  workshopId: string,
  moduleIds: string[],
  lessonIds: string[],
  activityIds: string[],
): Promise<string[]> {
  const conversationIds = new Set<string>()
  const courseConversationIds = await selectIdsByEq(
    supabase,
    'lia_conversations',
    'conversation_id',
    'course_id',
    workshopId,
    'No se pudieron consultar las conversaciones IA del taller',
    { ignoreMissingRelation: true },
  )

  courseConversationIds.forEach((conversationId) => conversationIds.add(conversationId))
  await appendConversationIdsByIn(supabase, conversationIds, 'module_id', moduleIds, 'No se pudieron consultar las conversaciones IA de modulos del taller')
  await appendConversationIdsByIn(supabase, conversationIds, 'lesson_id', lessonIds, 'No se pudieron consultar las conversaciones IA de lecciones del taller')
  await appendConversationIdsByIn(supabase, conversationIds, 'activity_id', activityIds, 'No se pudieron consultar las conversaciones IA de actividades del taller')

  return Array.from(conversationIds)
}
