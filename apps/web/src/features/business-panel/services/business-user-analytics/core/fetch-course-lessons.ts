import { BusinessUserAnalyticsSupabaseClient } from './business-user-analytics-supabase-client'
import { chunkArray } from './chunk-array'
import { CourseLessonRecord } from './course-lesson-record'
import { logQueryError } from './log-query-error'
import { PAGE_LIMIT } from './page_limit'

export async function fetchCourseLessons(
  supabase: BusinessUserAnalyticsSupabaseClient,
  courseIds: string[],
) {
  if (courseIds.length === 0) return []

  const rows: CourseLessonRecord[] = []
  for (const chunk of chunkArray(courseIds, 200)) {
    const { data, error } = await supabase
      .from('course_lessons')
      .select(`
        lesson_id,
        duration_seconds,
        total_duration_minutes,
        course_modules!inner (
          course_id
        )
      `)
      .eq('is_published', true)
      .in('course_modules.course_id', chunk)
      .limit(PAGE_LIMIT)
      .returns<CourseLessonRecord[]>()

    logQueryError('business user course lessons', error)
    rows.push(...(data || []))
  }

  return rows
}
