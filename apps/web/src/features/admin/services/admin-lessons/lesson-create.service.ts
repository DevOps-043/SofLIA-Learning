import { createClient } from '@/lib/supabase/server'
import { updateModuleDuration } from './duration.service'
import { enrichSingleLesson, translateCreatedLesson } from './lesson-enrichment.service'
import {
  assertCreateLessonDuration,
  buildCreateLessonPayload,
} from './lesson-mutation-payloads.service'
import { ADMIN_LESSON_SELECT_FIELDS } from './shared'
import type { AdminLesson, CreateLessonData } from './types'

export async function createLesson(
  moduleId: string,
  lessonData: CreateLessonData,
  userId?: string,
): Promise<AdminLesson> {
  const supabase = await createClient()
  assertCreateLessonDuration(lessonData)

  const { count } = await supabase
    .from('course_lessons')
    .select('lesson_id', { count: 'exact', head: true })
    .eq('module_id', moduleId)

  const { data, error } = await supabase
    .from('course_lessons')
    .insert(buildCreateLessonPayload(moduleId, lessonData, count))
    .select(ADMIN_LESSON_SELECT_FIELDS)
    .single()

  if (error || !data) {
    throw error
  }

  const createdLesson = data as AdminLesson
  await updateModuleDuration(moduleId)
  await translateCreatedLesson(createdLesson, userId)
  return enrichSingleLesson(supabase, createdLesson)
}
