import { createClient } from '@/lib/supabase/server'
import { updateModuleDuration } from './duration.service'
import { enrichSingleLesson } from './lesson-enrichment.service'
import { buildUpdateLessonPayload } from './lesson-mutation-payloads.service'
import { ADMIN_LESSON_SELECT_FIELDS } from './shared'
import type { AdminLesson, UpdateLessonData } from './types'

export async function updateLesson(
  lessonId: string,
  lessonData: UpdateLessonData,
): Promise<AdminLesson> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('course_lessons')
    .update(buildUpdateLessonPayload(lessonData))
    .eq('lesson_id', lessonId)
    .select(ADMIN_LESSON_SELECT_FIELDS)
    .single()

  if (error || !data) {
    throw error
  }

  const updatedLesson = data as AdminLesson
  if (updatedLesson.module_id) {
    await updateModuleDuration(updatedLesson.module_id)
  }

  return enrichSingleLesson(supabase, updatedLesson)
}
