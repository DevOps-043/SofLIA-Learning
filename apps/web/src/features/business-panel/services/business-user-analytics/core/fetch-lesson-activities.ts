import { BusinessUserAnalyticsSupabaseClient } from './business-user-analytics-supabase-client'
import { chunkArray } from './chunk-array'
import { LessonActivityRecord } from './lesson-activity-record'
import { logQueryError } from './log-query-error'
import { PAGE_LIMIT } from './page_limit'

export async function fetchLessonActivities(
  supabase: BusinessUserAnalyticsSupabaseClient,
  lessonIds: string[],
) {
  if (lessonIds.length === 0) return []

  const rows: LessonActivityRecord[] = []
  for (const chunk of chunkArray(lessonIds, 200)) {
    const { data, error } = await supabase
      .from('lesson_activities')
      .select('activity_id, lesson_id, is_required, estimated_time_minutes')
      .in('lesson_id', chunk)
      .limit(PAGE_LIMIT)
      .returns<LessonActivityRecord[]>()

    logQueryError('business user lesson activities', error)
    rows.push(...(data || []))
  }

  return rows
}
