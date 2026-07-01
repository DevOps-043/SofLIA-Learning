// Barrel re-export — all logic lives in sub-files
import type { createClient as createSupabaseClient } from '@/lib/supabase/server'
import type { createAdminClient } from '@/lib/supabase/admin'

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
import type { LearningPathAccessState } from '@/features/learning-paths/services/learning-path-access.server'

export interface CourseRow {
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
  learningPathState?: LearningPathAccessState | null
  totalTimeMs: number
}

type SupabaseServerClient =
  | Awaited<ReturnType<typeof createSupabaseClient>>
  | ReturnType<typeof createAdminClient>

export async function loadLearnDataPayload(
  supabase: SupabaseServerClient,
  slug: string,
  lessonId: string | null,
  language: string,
  userId?: string,
  organizationId?: string | null,
  includeLessonData = false,
  prefetchedCourse?: CourseRow,
): Promise<LearnDataQueryPayload> {
  const startedAt = Date.now()
  // Accept a pre-fetched course to avoid a duplicate DB round-trip when the
  // caller already resolved the course (e.g. to parallelize the LP check).
  const course = prefetchedCourse ?? await loadCourseBySlug(supabase, slug)

  // notesStats uses the get_course_notes_stats RPC when enrollmentId is
  // undefined — it doesn't need the enrollment ID from modulesResult, so it
  // can run in parallel with the other queries instead of sequentially after.
  const [modulesResult, questionsResult, lessonDataResult, notesStatsResult] =
    await Promise.all([
      loadModulesWithProgress(
        supabase,
        course.id,
        userId,
        language,
        organizationId,
      ),
      loadCourseQuestions(supabase, course.id, userId),
      includeLessonData && lessonId
        ? loadLessonData(supabase, course.id, lessonId, language)
        : Promise.resolve(null),
      userId
        ? loadNotesStats(supabase, course.id, userId, undefined)
        : Promise.resolve(null),
    ])

  return {
    course,
    modulesResult,
    questionsResult,
    notesStatsResult,
    lessonDataResult,
    learningPathState: null,
    totalTimeMs: Date.now() - startedAt,
  }
}
