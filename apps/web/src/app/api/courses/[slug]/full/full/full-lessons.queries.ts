import type { LessonQueryData } from './full-results.types'
import type {
  CourseLessonRow,
  CourseModuleRow,
  FullCourseRequest,
  LessonProgressRow,
  EnrollmentRow,
} from './full.types'

export async function fetchLessonQueryData(
  request: FullCourseRequest,
  modules: CourseModuleRow[],
  enrollment: EnrollmentRow | null,
): Promise<LessonQueryData> {
  const moduleIds = modules.map((module) => module.module_id)
  const [lessonsResult, progressResult] = await Promise.all([
    request.supabase
      .from('course_lessons')
      .select(`
        lesson_id, lesson_title, lesson_description, lesson_order_index,
        duration_seconds, total_duration_minutes, video_provider_id,
        video_provider, is_published, module_id
      `)
      .in('module_id', moduleIds)
      .order('lesson_order_index', { ascending: true }),
    enrollment?.enrollment_id
      ? request.supabase
          .from('user_lesson_progress')
          .select('lesson_id, is_completed, video_progress_percentage')
          .eq('enrollment_id', enrollment.enrollment_id)
      : Promise.resolve({ data: [], error: null }),
  ])

  return {
    lessons: (lessonsResult.data || []) as CourseLessonRow[],
    progress: new Map(
      ((progressResult.data || []) as LessonProgressRow[]).map((progress) => [
        progress.lesson_id,
        progress,
      ]),
    ),
  }
}
