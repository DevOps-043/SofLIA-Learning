import { logger } from '../../../../../lib/utils/logger'
import { createAdminClient, parseSessionMetrics } from './calendar.service'
import type {
  LessonProgressSummary,
  StudySessionRow,
} from './context-data.types'

type AdminClient = ReturnType<typeof createAdminClient>

export async function loadLessonProgressMap(params: {
  supabase: AdminClient
  userId: string
  sessions: StudySessionRow[]
  tracePrefix: string
}): Promise<Map<string, LessonProgressSummary>> {
  const lessonIds = getPlannedLessonIds(params.sessions)
  const lessonProgressMap = new Map<string, LessonProgressSummary>()

  if (lessonIds.length === 0) {
    return lessonProgressMap
  }

  const { data: progressRows, error } = await params.supabase
    .from('user_lesson_progress')
    .select('lesson_id, progress_percentage, is_completed')
    .eq('user_id', params.userId)
    .in('lesson_id', lessonIds)

  if (error) {
    logger.warn(`${params.tracePrefix} failed to enrich lesson progress`, error)
  }

  for (const row of progressRows ?? []) {
    lessonProgressMap.set(row.lesson_id, {
      pct: row.progress_percentage ?? 0,
      completed: Boolean(row.is_completed),
    })
  }

  return lessonProgressMap
}

export function deriveSessionProgress(
  session: Pick<StudySessionRow, 'metrics'>,
  lessonProgressMap: Map<string, LessonProgressSummary>,
): {
  derivedStatus: 'effectively_completed' | 'in_progress' | null
  progressPct?: number
} {
  const lessonIds = getPlannedLessonIds([session])

  if (lessonIds.length === 0) {
    return { derivedStatus: null }
  }

  const progressRows = lessonIds
    .map((lessonId) => lessonProgressMap.get(lessonId))
    .filter((row): row is LessonProgressSummary => Boolean(row))

  if (progressRows.length === 0) {
    return { derivedStatus: null }
  }

  const avgProgressPct = Math.round(
    progressRows.reduce((sum, row) => sum + row.pct, 0) / progressRows.length,
  )

  if (progressRows.every((row) => row.completed)) {
    return {
      derivedStatus: 'effectively_completed',
      progressPct: 100,
    }
  }

  if (progressRows.some((row) => row.pct > 0)) {
    return {
      derivedStatus: 'in_progress',
      progressPct: avgProgressPct,
    }
  }

  return {
    derivedStatus: null,
    progressPct: avgProgressPct > 0 ? avgProgressPct : undefined,
  }
}

function getPlannedLessonIds(
  sessions: Array<Pick<StudySessionRow, 'metrics'>>,
): string[] {
  return Array.from(
    new Set(
      sessions.flatMap((session) => {
        const metrics = parseSessionMetrics(session.metrics)
        return (metrics?.plannedLessons || [])
          .map((lesson) => lesson.lessonId)
          .filter((lessonId): lessonId is string => Boolean(lessonId))
      }),
    ),
  )
}
