import { SupabaseClient } from '@supabase/supabase-js'
import { resolveCourseEnrollment } from '@/features/courses/services/course-enrollment.server.service'

export async function resolveQuizContext(
  supabase: SupabaseClient,
  slug: string,
  lessonId: string,
  userId: string,
  organizationId: string | null,
) {
  const { data: course } = await supabase.from('courses').select('id').eq('slug', slug).single()
  if (!course) throw Object.assign(new Error('Curso no encontrado'), { status: 404 })

  const enrollment = await resolveCourseEnrollment(supabase, userId, course.id, organizationId)
  if (!enrollment) throw Object.assign(new Error('No estas inscrito en este curso'), { status: 404 })

  const { data: lesson } = await supabase
    .from('course_lessons')
    .select('lesson_id, is_published')
    .eq('lesson_id', lessonId)
    .single()

  if (!lesson) throw Object.assign(new Error('Leccion no encontrada'), { status: 404 })
  if (lesson.is_published === false) {
    throw Object.assign(new Error('Esta leccion no esta disponible'), { status: 403 })
  }

  return { enrollmentId: enrollment.enrollment_id }
}
