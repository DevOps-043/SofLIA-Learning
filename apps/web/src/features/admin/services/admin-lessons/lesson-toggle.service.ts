import { createClient } from '@/lib/supabase/server'
import { ADMIN_LESSON_SELECT_FIELDS } from './shared'
import type { AdminLesson } from './types'

export async function toggleLessonPublished(
  lessonId: string,
): Promise<AdminLesson> {
  const supabase = await createClient()
  const { data: currentLesson } = await supabase
    .from('course_lessons')
    .select('is_published')
    .eq('lesson_id', lessonId)
    .single()

  if (!currentLesson) {
    throw new Error('Lección no encontrada')
  }

  const { data, error } = await supabase
    .from('course_lessons')
    .update({
      is_published: !(currentLesson as { is_published: boolean }).is_published,
      updated_at: new Date().toISOString(),
    })
    .eq('lesson_id', lessonId)
    .select(ADMIN_LESSON_SELECT_FIELDS)
    .single()

  if (error || !data) {
    throw error
  }

  return data as AdminLesson
}
