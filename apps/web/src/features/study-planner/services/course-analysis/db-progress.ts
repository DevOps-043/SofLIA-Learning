import { createClient } from '../../../../lib/supabase/server'
import type {
  CourseLessonCountRow,
  UserCourseProgressRow,
  UserCourseProgressSummaryRow,
  UserStudyStreakRow,
} from './types'

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
