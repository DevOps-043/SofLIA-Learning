import { NextResponse } from 'next/server'
import { courseLoadErrorResponse } from './estimation-responses'
import type {
  CourseInfo,
  CourseLessonInfo,
  CourseModuleInfo,
  CourseStructure,
  EstimateSupabaseClient,
} from './estimation.types'

async function loadCourse(supabase: EstimateSupabaseClient, courseId: string) {
  const { data: course, error } = await supabase
    .from('courses')
    .select('id, title')
    .eq('id', courseId)
    .returns<CourseInfo>()
    .single()

  if (error || !course) {
    return courseLoadErrorResponse(404, 'Curso no encontrado')
  }

  return course
}

async function loadModules(supabase: EstimateSupabaseClient, courseId: string) {
  const { data, error } = await supabase
    .from('course_modules')
    .select('module_id, module_title')
    .eq('course_id', courseId)
    .order('module_order_index', { ascending: true })

  if (error) {
    return courseLoadErrorResponse(500, 'No se pudieron obtener los modulos del curso')
  }

  return (data || []) as CourseModuleInfo[]
}

export async function loadCourseStructure(
  supabase: EstimateSupabaseClient,
  courseId: string,
): Promise<CourseStructure | NextResponse> {
  const course = await loadCourse(supabase, courseId)
  if (course instanceof NextResponse) return course

  const modules = await loadModules(supabase, courseId)
  if (modules instanceof NextResponse) return modules

  const moduleIds = modules.map((module) => module.module_id)
  if (moduleIds.length === 0) {
    return { course, modules, lessons: [], moduleIds, lessonIds: [] }
  }

  const { data, error } = await supabase
    .from('course_lessons')
    .select('lesson_id, lesson_title, module_id')
    .in('module_id', moduleIds)
    .order('lesson_order_index', { ascending: true })

  if (error) {
    return courseLoadErrorResponse(500, 'No se pudieron obtener las lecciones del curso')
  }

  const lessons = (data || []) as CourseLessonInfo[]
  return {
    course,
    modules,
    lessons,
    moduleIds,
    lessonIds: lessons.map((lesson) => lesson.lesson_id),
  }
}
