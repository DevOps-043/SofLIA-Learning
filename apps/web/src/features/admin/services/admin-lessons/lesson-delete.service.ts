import { createClient } from '@/lib/supabase/server'
import { updateModuleDuration } from './duration.service'
import {
  deleteDirectLessonDependencies,
  deleteLessonActivityDependencies,
  deleteLessonConversationDependencies,
  deleteLocalizedLessonRows,
} from './lesson-delete-dependencies.service'

export async function deleteLesson(lessonId: string): Promise<void> {
  const supabase = await createClient()
  const { data: lesson } = await supabase
    .from('course_lessons')
    .select('module_id')
    .eq('lesson_id', lessonId)
    .single()

  await deleteLessonActivityDependencies(supabase, lessonId)
  await deleteLessonConversationDependencies(supabase, lessonId)
  await deleteDirectLessonDependencies(supabase, lessonId)

  const deleteError = await deleteLocalizedLessonRows(supabase, lessonId)
  if (deleteError) {
    throw deleteError
  }

  const moduleId = (lesson as { module_id?: string | null } | null)?.module_id
  if (moduleId) {
    await updateModuleDuration(moduleId)
  }
}
