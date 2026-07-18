import { createAdminClient } from '@/lib/supabase/admin'
import { updateModuleDuration } from './duration.service'
import {
  deleteDirectLessonDependencies,
  deleteLessonActivityDependencies,
  deleteLessonConversationDependencies,
  deleteLocalizedLessonRows,
} from './lesson-delete-dependencies.service'

export async function deleteLesson(lessonId: string): Promise<void> {
  // Cliente admin (service role): la autorizacion ya la valido la ruta con
  // requireAdmin(). Con el cliente user-scoped, la RLS de las tablas de
  // actividad (user_lesson_progress y compania) omite las filas de otros
  // usuarios sin error, y el DELETE final de course_lessons revienta por
  // foreign key -> DELETE_LESSON_FAILED.
  const supabase = createAdminClient()
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
