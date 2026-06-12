import { BusinessUserAnalyticsSupabaseClient } from './business-user-analytics-supabase-client'
import { chunkArray } from './chunk-array'
import { logQueryError } from './log-query-error'
import { PAGE_LIMIT } from './page_limit'

/**
 * Devuelve el conjunto de `lesson_id` (dentro del scope) que TIENEN un quiz, ya sea
 * como material (`lesson_materials.material_type = 'quiz'`) o como actividad
 * (`lesson_activities.activity_type = 'quiz'`). Sirve de DENOMINADOR para contextualizar
 * los quizzes ("X de Y lecciones con quiz"): no toda lección tiene quiz.
 */
export async function fetchQuizLessonIds(
  supabase: BusinessUserAnalyticsSupabaseClient,
  lessonIds: string[],
): Promise<string[]> {
  if (lessonIds.length === 0) return []

  const withQuiz = new Set<string>()
  for (const chunk of chunkArray(lessonIds, 200)) {
    const [materials, activities] = await Promise.all([
      supabase
        .from('lesson_materials')
        .select('lesson_id')
        .in('lesson_id', chunk)
        .eq('material_type', 'quiz')
        .limit(PAGE_LIMIT),
      supabase
        .from('lesson_activities')
        .select('lesson_id')
        .in('lesson_id', chunk)
        .eq('activity_type', 'quiz')
        .limit(PAGE_LIMIT),
    ])

    logQueryError('business user quiz lessons (materials)', materials.error)
    logQueryError('business user quiz lessons (activities)', activities.error)

    for (const row of materials.data || []) {
      if (row.lesson_id) withQuiz.add(row.lesson_id)
    }
    for (const row of activities.data || []) {
      if (row.lesson_id) withQuiz.add(row.lesson_id)
    }
  }

  return Array.from(withQuiz)
}
