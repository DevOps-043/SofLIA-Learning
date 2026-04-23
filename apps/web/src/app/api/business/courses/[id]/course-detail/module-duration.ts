import type {
  CourseLessonRow,
  EstimatedMinutesRow,
  SupabaseServerClient,
} from './types'

function sumEstimatedMinutes(rows: EstimatedMinutesRow[] | null) {
  return (rows || []).reduce(
    (sum, row) => sum + (row.estimated_time_minutes || 0),
    0,
  )
}

export async function calculateModuleDurationMinutes(
  supabase: SupabaseServerClient,
  lessons: CourseLessonRow[],
) {
  const lessonIds = lessons.map((lesson) => lesson.lesson_id)
  let totalDuration = 0
  let hasLessonTotalDuration = false

  lessons.forEach((lesson) => {
    if (lesson.total_duration_minutes && lesson.total_duration_minutes > 0) {
      totalDuration += lesson.total_duration_minutes
      hasLessonTotalDuration = true
    } else if (lesson.duration_seconds && lesson.duration_seconds > 0) {
      totalDuration += Math.ceil(lesson.duration_seconds / 60)
    }
  })

  if (hasLessonTotalDuration || lessonIds.length === 0) return totalDuration

  const [{ data: materials }, { data: activities }] = await Promise.all([
    supabase.from('lesson_materials').select('estimated_time_minutes').in('lesson_id', lessonIds).returns<EstimatedMinutesRow[]>(),
    supabase.from('lesson_activities').select('estimated_time_minutes').in('lesson_id', lessonIds).returns<EstimatedMinutesRow[]>(),
  ])

  return totalDuration + sumEstimatedMinutes(materials) + sumEstimatedMinutes(activities)
}
