import { createClient } from '@/lib/supabase/server'
import {
  ADMIN_LESSON_SELECT_FIELDS,
  enrichLessonWithInstructorName,
  fetchInstructorNameMap,
  hydrateLessonVideoProviderId,
} from './shared'
import type { AdminLesson } from './types'

export async function getModuleLessons(moduleId: string): Promise<AdminLesson[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('course_lessons')
    .select(ADMIN_LESSON_SELECT_FIELDS)
    .eq('module_id', moduleId)
    .order('lesson_order_index', { ascending: true })

  if (error) {
    throw error
  }

  const lessons = (data || []) as AdminLesson[]
  const instructorNameMap = await fetchInstructorNameMap(
    supabase,
    lessons.map((lesson) => lesson.instructor_id),
  )

  return lessons.map((lesson) =>
    enrichLessonWithInstructorName(
      hydrateLessonVideoProviderId(lesson),
      instructorNameMap,
      'Instructor no asignado',
    ),
  )
}

export async function getLessonById(
  lessonId: string,
): Promise<AdminLesson | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('course_lessons')
    .select(ADMIN_LESSON_SELECT_FIELDS)
    .eq('lesson_id', lessonId)
    .single()

  if (error || !data) {
    return null
  }

  const lesson = hydrateLessonVideoProviderId(data as AdminLesson)
  const instructorNameMap = await fetchInstructorNameMap(
    supabase,
    lesson.instructor_id ? [lesson.instructor_id] : [],
  )

  return enrichLessonWithInstructorName(lesson, instructorNameMap)
}
