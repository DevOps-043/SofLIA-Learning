// Barrel re-export — all logic lives in sub-files
import { createClient } from '@/lib/supabase/server'

// Re-export from sub-files
export {
  getLessonsTableName,
  resolveLastWatchedLessonId,
  loadCourseBySlug,
  loadModulesWithProgress,
  loadCourseQuestions,
  type ModulesWithProgressResult,
} from './learn-data/learn-data-lessons.service'
export { loadLessonData, type LessonDataResult } from './learn-data/learn-data-materials.service'
export { loadNotesStats, type NotesStats } from './learn-data/learn-data-progress.service'

import { loadCourseBySlug, loadModulesWithProgress, loadCourseQuestions } from './learn-data/learn-data-lessons.service'
import { loadLessonData, type LessonDataResult } from './learn-data/learn-data-materials.service'
import { loadNotesStats, type NotesStats } from './learn-data/learn-data-progress.service'
import type { ModulesWithProgressResult } from './learn-data/learn-data-lessons.service'

interface CourseRow {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  instructor_id: string | null
  category: string | null
  level: string | null
  price: number | null
  is_active: boolean | null
}

interface QuestionRow extends Record<string, unknown> {
  id: string
}

export interface LearnDataQueryPayload {
  course: CourseRow
  modulesResult: ModulesWithProgressResult
  questionsResult: QuestionRow[]
  notesStatsResult: NotesStats | null
  lessonDataResult: LessonDataResult | null
  totalTimeMs: number
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

export async function loadLearnDataPayload(
  supabase: SupabaseServerClient,
  slug: string,
  lessonId: string | null,
  language: string,
  userId?: string,
): Promise<LearnDataQueryPayload> {
  const startedAt = Date.now()
  const course = await loadCourseBySlug(supabase, slug)
  const [modulesResult, questionsResult, notesStatsResult, lessonDataResult] =
    await Promise.all([
      loadModulesWithProgress(supabase, course.id, userId, language),
      loadCourseQuestions(supabase, course.id, userId),
      userId ? loadNotesStats(supabase, course.id, userId) : Promise.resolve(null),
      lessonId
        ? loadLessonData(supabase, course.id, lessonId, language)
        : Promise.resolve(null),
    ])

  return {
    course,
    modulesResult,
    questionsResult,
    notesStatsResult,
    lessonDataResult,
    totalTimeMs: Date.now() - startedAt,
  }
}
