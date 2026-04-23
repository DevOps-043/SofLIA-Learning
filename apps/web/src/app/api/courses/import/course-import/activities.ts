import { normalizeImportedActivityContent } from '@/lib/course-content'
import { normalizeQuizData } from './quiz-normalizer'
import type { ImportedActivity, ServiceSupabaseClient } from './types'

function resolveActivityType(activityType: string) {
  if (activityType === 'quiz') return 'quiz'
  if (activityType === 'lia_script') return 'ai_chat'
  return 'exercise'
}

function buildActivityContent(activity: ImportedActivity) {
  return activity.type === 'quiz'
    ? JSON.stringify(normalizeQuizData(activity.data))
    : normalizeImportedActivityContent(activity.type, activity.data)
}

export async function insertImportedActivities(
  supabase: ServiceSupabaseClient,
  lessonId: string,
  activities: ImportedActivity[],
) {
  if (!activities.length) return

  const rows = activities.map((activity, index) => ({
    lesson_id: lessonId,
    activity_title: activity.title,
    activity_type: resolveActivityType(activity.type),
    activity_content: buildActivityContent(activity),
    activity_order_index: index + 1,
    is_required: false,
  }))

  const { error } = await supabase.from('lesson_activities').insert(rows)
  if (error) throw error
}
