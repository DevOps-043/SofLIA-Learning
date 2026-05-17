import { createClient } from '@/lib/supabase/server'

interface LessonOrderUpdate {
  lesson_id: string
  lesson_order_index: number
}

async function applyLessonOrderOffset(
  lessons: LessonOrderUpdate[],
  offset: number,
) {
  const supabase = await createClient()

  return Promise.all(
    lessons.map((lesson) =>
      supabase
        .from('course_lessons')
        .update({
          lesson_order_index: lesson.lesson_order_index + offset,
          updated_at: new Date().toISOString(),
        })
        .eq('lesson_id', lesson.lesson_id),
    ),
  )
}

function throwFirstReorderError(
  phase: string,
  results: Awaited<ReturnType<typeof applyLessonOrderOffset>>,
) {
  const failedResult = results.find((result) => result.error)
  if (failedResult?.error) {
    throw new Error(`${phase}: ${failedResult.error.message}`)
  }
}

export async function reorderLessons(
  lessons: LessonOrderUpdate[],
): Promise<void> {
  const temporaryResults = await applyLessonOrderOffset(lessons, 10000)
  throwFirstReorderError('Error al reordenar (fase 1)', temporaryResults)

  const finalResults = await applyLessonOrderOffset(lessons, 0)
  throwFirstReorderError('Error al reordenar lecciones', finalResults)
}
