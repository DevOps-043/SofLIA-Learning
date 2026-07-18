import type { AdminLessonsSupabaseClient } from './shared'

type DeleteResult = { error: { message?: string } | null }

// Un borrado de dependencia fallido no puede ignorarse: deja filas huérfanas
// que hacen reventar por foreign key el DELETE final de course_lessons, con un
// error genérico imposible de diagnosticar. Fail fast con la tabla culpable.
function assertDeleteSucceeded(tableName: string, result: DeleteResult) {
  if (result.error) {
    throw new Error(
      `No se pudo borrar dependencias de la leccion en "${tableName}": ${result.error.message || 'error desconocido'}`,
    )
  }
}

const DIRECT_LESSON_DEPENDENCY_TABLES = [
  'lesson_materials',
  'lesson_checkpoints',
  'lesson_feedback',
  'lesson_tracking',
  'lesson_time_estimates',
  'lesson_chat_suggestions',
  'lia_common_questions',
  'study_sessions',
  'user_activity_log',
  'user_activity_submissions',
  'user_lesson_notes',
  'user_lesson_progress',
  'user_quiz_submissions',
] as const

export async function deleteLessonActivityDependencies(
  supabase: AdminLessonsSupabaseClient,
  lessonId: string,
) {
  const { data: activities } = await supabase
    .from('lesson_activities')
    .select('activity_id')
    .eq('lesson_id', lessonId)

  const activityIds = (activities || []).map((activity) => activity.activity_id)
  if (!activityIds.length) return

  assertDeleteSucceeded(
    'lia_activity_completions',
    await supabase.from('lia_activity_completions').delete().in('activity_id', activityIds),
  )
  assertDeleteSucceeded(
    'lia_common_questions',
    await supabase.from('lia_common_questions').delete().in('activity_id', activityIds),
  )
  assertDeleteSucceeded(
    'lesson_activities',
    await supabase.from('lesson_activities').delete().in('activity_id', activityIds),
  )
}

export async function deleteLessonConversationDependencies(
  supabase: AdminLessonsSupabaseClient,
  lessonId: string,
) {
  const { data: conversations } = await supabase
    .from('lia_conversations')
    .select('conversation_id')
    .eq('lesson_id', lessonId)

  const conversationIds = (conversations || []).map(
    (conversation) => conversation.conversation_id,
  )
  if (!conversationIds.length) return

  assertDeleteSucceeded(
    'lia_messages',
    await supabase.from('lia_messages').delete().in('conversation_id', conversationIds),
  )
  assertDeleteSucceeded(
    'lia_activity_completions',
    await supabase
      .from('lia_activity_completions')
      .delete()
      .in('conversation_id', conversationIds),
  )
  assertDeleteSucceeded(
    'lia_conversations',
    await supabase.from('lia_conversations').delete().in('conversation_id', conversationIds),
  )
}

export async function deleteDirectLessonDependencies(
  supabase: AdminLessonsSupabaseClient,
  lessonId: string,
) {
  const results = await Promise.all(
    DIRECT_LESSON_DEPENDENCY_TABLES.map(async (tableName) => ({
      result: (await supabase
        .from(tableName as never)
        .delete()
        .eq('lesson_id' as never, lessonId)) as DeleteResult,
      tableName,
    })),
  )

  results.forEach(({ result, tableName }) => assertDeleteSucceeded(tableName, result))

  assertDeleteSucceeded(
    'content_translations',
    await supabase
      .from('content_translations')
      .delete()
      .eq('entity_type', 'lesson')
      .eq('entity_id', lessonId),
  )
}

export async function deleteLocalizedLessonRows(
  supabase: AdminLessonsSupabaseClient,
  lessonId: string,
) {
  const results = await Promise.all([
    supabase.from('course_lessons').delete().eq('lesson_id', lessonId),
    supabase.from('course_lessons_en').delete().eq('lesson_id', lessonId),
    supabase.from('course_lessons_pt').delete().eq('lesson_id', lessonId),
  ])

  return results.find((result) => result.error)?.error
}
