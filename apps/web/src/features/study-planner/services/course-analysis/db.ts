import { createClient } from '../../../../lib/supabase/server'
import { fromLoose } from '../../../../lib/supabase/looseQuery'
import {
  COURSE_INFO_SELECT,
  PERSON_NAME_SELECT,
} from '../course-query.shared'
import type {
  CourseLessonCountRow,
  CourseInfoRow,
  CourseModuleRow,
  LessonActivityRow,
  LessonEstimateRow,
  LessonMaterialRow,
  LessonRow,
  UserCourseProgressRow,
  UserCourseProgressSummaryRow,
  UserStudyStreakRow,
} from './types'

export async function fetchCourseInfoRow(
  courseId: string,
): Promise<CourseInfoRow | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('courses')
    .select(`
      ${COURSE_INFO_SELECT},
      instructor:instructor_id (
        ${PERSON_NAME_SELECT}
      )
    `)
    .eq('id', courseId)
    .single()

  if (error || !data) {
    console.error('Error obteniendo informacion del curso:', error)
    return null
  }

  return data as unknown as CourseInfoRow
}

export async function fetchCourseModulesRows(
  courseId: string,
): Promise<CourseModuleRow[]> {
  const moduleRows = await fetchCourseModulesRowsByCourseIds([courseId])
  return moduleRows.filter((module) => module.course_id === courseId)
}

export async function fetchCourseModulesRowsByCourseIds(
  courseIds: string[],
): Promise<CourseModuleRow[]> {
  if (courseIds.length === 0) {
    return []
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('course_modules')
    .select(`
      course_id,
      module_id,
      module_title,
      module_description,
      module_order_index,
      module_duration_minutes,
      is_required,
      is_published,
      course_lessons (
        lesson_id,
        lesson_title,
        lesson_description,
        lesson_order_index,
        duration_seconds,
        is_published
      )
    `)
    .in('course_id', courseIds)
    .eq('is_published', true)
    .order('course_id', { ascending: true })
    .order('module_order_index', { ascending: true })

  if (error || !data) {
    console.error('Error obteniendo modulos del curso:', error)
    return []
  }

  return data as unknown as CourseModuleRow[]
}

export async function fetchLessonRows(lessonIds: string[]): Promise<LessonRow[]> {
  if (lessonIds.length === 0) {
    return []
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('course_lessons')
    .select('lesson_id, lesson_title, duration_seconds')
    .in('lesson_id', lessonIds)

  if (error || !data) {
    console.error('Error obteniendo lecciones:', error)
    return []
  }

  return data as unknown as LessonRow[]
}

export async function fetchLessonEstimateRows(
  lessonIds: string[],
): Promise<LessonEstimateRow[]> {
  if (lessonIds.length === 0) {
    return []
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('lesson_time_estimates')
    .select(`
      lesson_id,
      video_minutes,
      activities_time_minutes,
      reading_time_minutes,
      quiz_time_minutes,
      exercise_time_minutes,
      link_time_minutes,
      interactions_time_minutes,
      total_time_minutes
    `)
    .in('lesson_id', lessonIds)

  if (error || !data) {
    console.error('Error obteniendo estimaciones de leccion:', error)
    return []
  }

  return data as unknown as LessonEstimateRow[]
}

export async function fetchLessonActivityRows(
  lessonIds: string[],
): Promise<LessonActivityRow[]> {
  if (lessonIds.length === 0) {
    return []
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('lesson_activities')
    .select('lesson_id, estimated_time_minutes')
    .in('lesson_id', lessonIds)

  if (error || !data) {
    console.error('Error obteniendo actividades de leccion:', error)
    return []
  }

  return data as unknown as LessonActivityRow[]
}

export async function fetchLessonMaterialRows(
  lessonIds: string[],
): Promise<LessonMaterialRow[]> {
  if (lessonIds.length === 0) {
    return []
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('lesson_materials')
    .select('lesson_id, estimated_time_minutes, material_type')
    .in('lesson_id', lessonIds)

  if (error || !data) {
    console.error('Error obteniendo materiales de leccion:', error)
    return []
  }

  return data as unknown as LessonMaterialRow[]
}

export async function fetchUserCourseProgressRow(
  userId: string,
  courseId: string,
): Promise<UserCourseProgressRow | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_course_enrollments')
    .select('progress_percentage, completed_lessons_count, last_accessed_at')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single()

  if (error || !data) {
    return null
  }

  return data as unknown as UserCourseProgressRow
}

export async function fetchUserCourseProgressRows(
  userId: string,
  courseIds: string[],
): Promise<UserCourseProgressSummaryRow[]> {
  if (courseIds.length === 0) {
    return []
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_course_enrollments')
    .select(
      'course_id, progress_percentage, completed_lessons_count, last_accessed_at',
    )
    .eq('user_id', userId)
    .in('course_id', courseIds)

  if (error || !data) {
    console.error('Error obteniendo progreso de cursos:', error)
    return []
  }

  return data as unknown as UserCourseProgressSummaryRow[]
}

export async function fetchCourseLessonCountRows(
  courseIds: string[],
): Promise<CourseLessonCountRow[]> {
  if (courseIds.length === 0) {
    return []
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('course_modules')
    .select(`
      course_id,
      course_lessons (
        lesson_id,
        is_published
      )
    `)
    .in('course_id', courseIds)
    .eq('is_published', true)

  if (error || !data) {
    console.error('Error obteniendo conteo de lecciones por curso:', error)
    return []
  }

  return data as unknown as CourseLessonCountRow[]
}

export async function fetchCompletedLessonIds(userId: string): Promise<Set<string>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_lesson_progress')
    .select('lesson_id')
    .eq('user_id', userId)
    .eq('is_completed', true)

  if (error || !data) {
    console.error('Error obteniendo progreso de lecciones:', error)
    return new Set()
  }

  return new Set(data.map((lesson) => lesson.lesson_id))
}

export async function fetchActivePurchasedCourseIds(userId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await fromLoose<{ course_id: string }>(supabase, 'course_purchases')
    .select('course_id')
    .eq('user_id', userId)
    .eq('access_status', 'active')

  return (data || []).map((course) => course.course_id)
}

export async function fetchAvailableCourseRows(params: {
  category?: string
  level?: string
  limit: number
  excludedCourseIds: string[]
}): Promise<CourseInfoRow[]> {
  const supabase = await createClient()
  let query = supabase
    .from('courses')
    .select(`
      ${COURSE_INFO_SELECT}
    `)
    .eq('is_active', true)
    .order('average_rating', { ascending: false })
    .limit(params.limit)

  if (params.excludedCourseIds.length > 0) {
    const { createPostgrestInFilter } = await import('./calculations')
    query = query.not('id', 'in', createPostgrestInFilter(params.excludedCourseIds))
  }

  if (params.category) {
    query = query.eq('category', params.category)
  }

  if (params.level) {
    query = query.eq('level', params.level)
  }

  const { data, error } = await query

  if (error || !data) {
    console.error('Error obteniendo cursos disponibles:', error)
    return []
  }

  return data as unknown as CourseInfoRow[]
}

export async function fetchUserStudyStreakRow(
  userId: string,
): Promise<UserStudyStreakRow | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return null
  }

  return data as unknown as UserStudyStreakRow
}
