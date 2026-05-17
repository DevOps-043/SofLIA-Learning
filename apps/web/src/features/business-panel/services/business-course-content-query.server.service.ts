import type {
  CourseLessonRow,
  CourseModuleRow,
  CourseReviewRow,
} from './business-course-detail.server.helpers'
import type {
  BusinessCourseDetailSupabaseClient,
  CourseRow,
} from './business-course-detail.server.types'

export async function fetchCourseRow(
  supabase: BusinessCourseDetailSupabaseClient,
  courseId: string,
) {
  return supabase
    .from('courses')
    .select(`
      id, title, description, category, level, instructor_id,
      duration_total_minutes, thumbnail_url, slug, price, average_rating,
      student_count, review_count, learning_objectives, created_at, updated_at
    `)
    .eq('id', courseId)
    .single<CourseRow>()
}

export async function fetchCourseModulesAndReviews(
  supabase: BusinessCourseDetailSupabaseClient,
  courseId: string,
) {
  return Promise.all([
    supabase
      .from('course_modules')
      .select('module_id, module_title, module_description, module_order_index, module_duration_minutes, is_required')
      .eq('course_id', courseId)
      .eq('is_published', true)
      .order('module_order_index', { ascending: true })
      .then((result) => result.data as CourseModuleRow[] || []),
    supabase
      .from('course_reviews')
      .select(`
        review_id, review_title, review_content, rating, is_verified, created_at,
        users!inner (display_name, first_name, last_name, username, profile_picture_url)
      `)
      .eq('course_id', courseId)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(10)
      .then((result) => result.data as CourseReviewRow[] || []),
  ])
}

export async function fetchLessonsForModules(
  supabase: BusinessCourseDetailSupabaseClient,
  moduleIds: string[],
) {
  if (moduleIds.length === 0) return []

  return supabase
    .from('course_lessons')
    .select(`
      lesson_id, module_id, lesson_title, lesson_description, lesson_order_index,
      duration_seconds, total_duration_minutes, video_provider, video_provider_id,
      instructor_id
    `)
    .in('module_id', moduleIds)
    .eq('is_published', true)
    .order('lesson_order_index', { ascending: true })
    .then((result) => result.data as CourseLessonRow[] || [])
}
