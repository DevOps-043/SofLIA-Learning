import { CourseActivityError } from './course-activity-error'
import type {
  CourseLessonContext,
  CourseRow,
  EnrollmentRow,
  SupabaseServerClient,
} from './activity-submission.types'

async function resolveCourseBySlug(
  supabase: SupabaseServerClient,
  slug: string,
) {
  const { data: course, error } = await supabase
    .from('courses')
    .select('id, title, instructor_id')
    .eq('slug', slug)
    .single()

  if (error || !course) {
    throw new CourseActivityError('COURSE_NOT_FOUND', 404, 'Curso no encontrado')
  }

  return course as CourseRow
}

async function ensureLessonBelongsToCourse(
  supabase: SupabaseServerClient,
  courseId: string,
  lessonId: string,
) {
  const { data: lesson, error } = await supabase
    .from('course_lessons')
    .select('lesson_id, module_id, course_modules!inner (module_id, course_id)')
    .eq('lesson_id', lessonId)
    .eq('course_modules.course_id', courseId)
    .single()

  if (error || !lesson) {
    throw new CourseActivityError(
      'LESSON_NOT_FOUND',
      404,
      'Leccion no encontrada o fuera del curso',
    )
  }
}

async function resolveEnrollment(
  supabase: SupabaseServerClient,
  userId: string,
  courseId: string,
) {
  const { data: enrollment, error } = await supabase
    .from('user_course_enrollments')
    .select('enrollment_id, organization_id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single()

  if (error || !enrollment) {
    throw new CourseActivityError(
      'ENROLLMENT_NOT_FOUND',
      404,
      'No estas inscrito en este curso',
    )
  }

  return enrollment as EnrollmentRow
}

export async function resolveCourseLessonContext(
  supabase: SupabaseServerClient,
  userId: string,
  slug: string,
  lessonId: string,
): Promise<CourseLessonContext> {
  const course = await resolveCourseBySlug(supabase, slug)
  await ensureLessonBelongsToCourse(supabase, course.id, lessonId)
  const enrollment = await resolveEnrollment(supabase, userId, course.id)

  return {
    courseId: course.id,
    courseTitle: course.title,
    enrollmentId: enrollment.enrollment_id,
    instructorId: course.instructor_id,
    lessonId,
    organizationId: enrollment.organization_id,
    userId,
  }
}
