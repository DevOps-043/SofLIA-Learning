import { createClient } from '@/lib/supabase/server'
import { getLessonsTableName } from './learn-data-lessons.service'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

export interface LessonDataResult {
  lesson_id: string
  transcript: string | null
  summary: string | null
  activities: unknown[]
  materials: unknown[]
}

export async function loadLessonData(
  supabase: SupabaseServerClient,
  courseId: string,
  lessonId: string,
  language: string,
): Promise<LessonDataResult | null> {
  const { data: lesson, error } = await supabase
    .from(getLessonsTableName(language))
    .select(
      `
      lesson_id,
      module_id,
      transcript_content,
      summary_content,
      course_modules!inner (module_id, course_id)
    `,
    )
    .eq('lesson_id', lessonId)
    .eq('course_modules.course_id', courseId)
    .single()

  if (error || !lesson) {
    return null
  }

  const [activitiesResult, materialsResult] = await Promise.all([
    supabase
      .from('lesson_activities')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('activity_order_index', { ascending: true }),
    supabase
      .from('lesson_materials')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('material_order_index', { ascending: true }),
  ])

  return {
    lesson_id: lesson.lesson_id,
    transcript: lesson.transcript_content || null,
    summary: lesson.summary_content || null,
    activities: activitiesResult.data || [],
    materials: materialsResult.data || [],
  }
}
