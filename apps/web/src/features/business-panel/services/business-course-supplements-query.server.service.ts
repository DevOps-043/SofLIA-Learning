import type {
  CourseLessonRow,
  CourseSupplementRow,
} from './business-course-detail.server.helpers'
import type { BusinessCourseDetailSupabaseClient } from './business-course-detail.server.types'

export async function fetchCourseSupplements(
  supabase: BusinessCourseDetailSupabaseClient,
  lessons: CourseLessonRow[],
) {
  const lessonIds = lessons.map((lesson) => lesson.lesson_id)
  if (lessonIds.length === 0) {
    return { materials: [], activities: [] }
  }

  const [materials, activities] = await Promise.all([
    supabase
      .from('lesson_materials')
      .select('lesson_id, estimated_time_minutes')
      .in('lesson_id', lessonIds)
      .then((result) => result.data as CourseSupplementRow[] || []),
    supabase
      .from('lesson_activities')
      .select('lesson_id, estimated_time_minutes')
      .in('lesson_id', lessonIds)
      .then((result) => result.data as CourseSupplementRow[] || []),
  ])

  return { materials, activities }
}
