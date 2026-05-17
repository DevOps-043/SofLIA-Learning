import type { AdminLessonsSupabaseClient } from './shared'

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

  await supabase.from('lia_activity_completions').delete().in('activity_id', activityIds)
  await supabase.from('lia_common_questions').delete().in('activity_id', activityIds)
  await supabase.from('lesson_activities').delete().in('activity_id', activityIds)
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

  await supabase.from('lia_messages').delete().in('conversation_id', conversationIds)
  await supabase
    .from('lia_activity_completions')
    .delete()
    .in('conversation_id', conversationIds)
  await supabase.from('lia_conversations').delete().in('conversation_id', conversationIds)
}

export async function deleteDirectLessonDependencies(
  supabase: AdminLessonsSupabaseClient,
  lessonId: string,
) {
  await Promise.all(
    DIRECT_LESSON_DEPENDENCY_TABLES.map((tableName) =>
      supabase.from(tableName as never).delete().eq('lesson_id' as never, lessonId),
    ),
  )

  await supabase
    .from('content_translations')
    .delete()
    .eq('entity_type', 'lesson')
    .eq('entity_id', lessonId)
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
