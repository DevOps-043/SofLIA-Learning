import type { createClient } from '@/lib/supabase/server'
import type { DeadlineCourseRow } from './types'

type DeadlineSupabaseClient = Awaited<ReturnType<typeof createClient>>

const DEADLINE_COURSE_SELECT = `
  id,
  title,
  description,
  level,
  duration_total_minutes,
  category,
  course_modules (
    module_title,
    module_description,
    course_lessons (
      lesson_title,
      duration_seconds,
      lesson_time_estimates (
        total_time_minutes,
        video_minutes,
        reading_time_minutes,
        activities_time_minutes,
        quiz_time_minutes,
        exercise_time_minutes
      ),
      lesson_activities (
        activity_title,
        estimated_time_minutes
      ),
      lesson_materials (
        material_title,
        estimated_time_minutes
      )
    )
  )
`

export async function fetchDeadlineCourse(
  supabase: DeadlineSupabaseClient,
  courseId: string,
) {
  return supabase
    .from('courses')
    .select(DEADLINE_COURSE_SELECT)
    .eq('id', courseId)
    .single<DeadlineCourseRow>()
}
