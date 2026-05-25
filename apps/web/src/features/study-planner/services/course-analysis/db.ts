import { logger as techDebtLogger } from '@/lib/utils/logger'
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
} from './types'

export {
  fetchCompletedLessonIds,
  fetchCourseLessonCountRows,
  fetchUserCourseProgressRow,
  fetchUserCourseProgressRows,
  fetchUserStudyStreakRow,
} from './db-progress'

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
    techDebtLogger.error('Error obteniendo informacion del curso:', error)
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
    techDebtLogger.error('Error obteniendo modulos del curso:', error)
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
    techDebtLogger.error('Error obteniendo lecciones:', error)
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
    techDebtLogger.error('Error obteniendo estimaciones de leccion:', error)
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
    techDebtLogger.error('Error obteniendo actividades de leccion:', error)
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
    techDebtLogger.error('Error obteniendo materiales de leccion:', error)
    return []
  }

  return data as unknown as LessonMaterialRow[]
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
    techDebtLogger.error('Error obteniendo cursos disponibles:', error)
    return []
  }

  return data as unknown as CourseInfoRow[]
}
