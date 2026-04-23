import { SupabaseClient } from '@supabase/supabase-js'

export async function lessonHasRequiredQuizzes(supabase: SupabaseClient, lessonId: string) {
  const [materialQuizzes, activityQuizzes] = await Promise.all([
    supabase.from('lesson_materials').select('material_id').eq('lesson_id', lessonId).eq('material_type', 'quiz'),
    supabase
      .from('lesson_activities')
      .select('activity_id')
      .eq('lesson_id', lessonId)
      .eq('activity_type', 'quiz')
      .eq('is_required', true),
  ])

  return ((materialQuizzes.data?.length || 0) + (activityQuizzes.data?.length || 0)) > 0
}
