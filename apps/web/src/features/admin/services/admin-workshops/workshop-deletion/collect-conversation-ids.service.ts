import { selectIdsByEq, selectIdsByIn } from './id-query.service'
import type { SupabaseClient } from './types'

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

  for (const conversationId of courseConversationIds) {
    conversationIds.add(conversationId)
  }

  await appendConversationIdsByIn(supabase, conversationIds, 'module_id', moduleIds)
  await appendConversationIdsByIn(supabase, conversationIds, 'lesson_id', lessonIds)
  await appendConversationIdsByIn(supabase, conversationIds, 'activity_id', activityIds)

  return Array.from(conversationIds)
}

async function appendConversationIdsByIn(
  supabase: SupabaseClient,
  target: Set<string>,
  column: 'module_id' | 'lesson_id' | 'activity_id',
  values: string[],
): Promise<void> {
  if (!values.length) return

  const conversationIds = await selectIdsByIn(
    supabase,
    'lia_conversations',
    'conversation_id',
    column,
    values,
    `No se pudieron consultar las conversaciones IA de ${column} del taller`,
    { ignoreMissingRelation: true },
  )

  for (const conversationId of conversationIds) {
    target.add(conversationId)
  }
}
