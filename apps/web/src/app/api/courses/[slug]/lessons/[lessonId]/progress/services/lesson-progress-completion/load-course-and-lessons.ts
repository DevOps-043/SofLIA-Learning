import { LessonProgressError, sortLessonsForCourse } from '../lesson-progress.shared'
import type { CourseRow, LessonRow, ModuleRow, SupabaseServerClient } from './types'

export async function loadCourseAndLessons(
  supabase: SupabaseServerClient,
  slug: string,
) {
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, title, instructor_id')
    .eq('slug', slug)
    .single()

  if (courseError || !course) {
    throw new LessonProgressError('COURSE_NOT_FOUND', 404, 'Curso no encontrado')
  }

  const { data: modules, error: modulesError } = await supabase
    .from('course_modules')
    .select('module_id, module_order_index')
    .eq('course_id', course.id)
    .eq('is_published', true)
    .order('module_order_index', { ascending: true })

  if (modulesError || !modules || modules.length === 0) {
    throw new LessonProgressError('COURSE_HAS_NO_MODULES', 404, 'El curso no tiene modulos')
  }

  const { data: lessons, error: lessonsError } = await supabase
    .from('course_lessons')
    .select('lesson_id, lesson_title, lesson_order_index, module_id')
    .in('module_id', modules.map((module) => module.module_id))
    .eq('is_published', true)
    .order('lesson_order_index', { ascending: true })

  if (lessonsError || !lessons || lessons.length === 0) {
    throw new LessonProgressError('COURSE_HAS_NO_LESSONS', 404, 'El curso no tiene lecciones')
  }

  const moduleOrderMap = new Map((modules as ModuleRow[]).map((module) => [module.module_id, module.module_order_index]))
  return {
    course: course as CourseRow,
    lessons: sortLessonsForCourse(
      (lessons as Array<Omit<LessonRow, 'module_order_index'>>).map((lesson) => ({
        ...lesson,
        module_order_index: moduleOrderMap.get(lesson.module_id) || 0,
      })),
    ),
  }
}
