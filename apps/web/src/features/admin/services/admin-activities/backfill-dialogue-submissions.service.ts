import 'server-only'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import { dialogueSessionResultSchema } from '@/features/courses/types/dialogue-runtime/dialogue-session-result.schema'
import { syncDialogueResultToActivitySubmission } from '@/features/courses/services/soflia-dialogue/dialogue-result-submission-sync.service'
import type { DialogueSessionRow } from '@/features/courses/services/soflia-dialogue/dialogue-tables'
import type { CourseActivityContext } from '@/features/courses/services/activity-submission.server.service'

const DEFAULT_LIMIT = 5000

interface DialogueResultRow {
  result_id: string
  session_id: string
  activity_id: string
  user_id: string
  enrollment_id: string
  payload: unknown
}

interface DialogueSessionLite {
  session_id: string
  activity_id: string
  course_id: string | null
  lesson_id: string | null
  enrollment_id: string
  organization_id: string | null
  user_id: string
}

export interface BackfillDialogueSubmissionsInput {
  client: unknown
  userId?: string | null
  dryRun: boolean
  limit?: number
}

export interface BackfillDialogueSubmissionsResult {
  dryRun: boolean
  scannedResults: number
  eligibleActivities: number
  alreadyPresent: number
  created: number
  skipped: number
  failed: number
}

function submissionKey(userId: string, activityId: string, enrollmentId: string): string {
  return `${userId}|${activityId}|${enrollmentId}`
}

/**
 * Elige el mejor resultado por actividad+enrollment (completado > mayor score > más
 * reciente por result_id) para no sincronizar intentos redundantes de la misma
 * actividad. Espejo de la regla de `dialogue-activity-metrics`/del sync en vivo.
 */
function pickBestResultsPerActivity(rows: DialogueResultRow[]): Map<string, {
  row: DialogueResultRow
  result: ReturnType<typeof dialogueSessionResultSchema.parse>
}> {
  const best = new Map<string, { row: DialogueResultRow; result: ReturnType<typeof dialogueSessionResultSchema.parse> }>()

  for (const row of rows) {
    const parsed = dialogueSessionResultSchema.safeParse(row.payload)
    if (!parsed.success) continue

    const key = submissionKey(row.user_id, row.activity_id, row.enrollment_id)
    const existing = best.get(key)
    if (!existing) {
      best.set(key, { row, result: parsed.data })
      continue
    }

    const existingCompleted = existing.result.activityResult === 'completed'
    const candidateCompleted = parsed.data.activityResult === 'completed'
    if (candidateCompleted !== existingCompleted) {
      if (candidateCompleted) best.set(key, { row, result: parsed.data })
      continue
    }
    if (parsed.data.score > existing.result.score) {
      best.set(key, { row, result: parsed.data })
    }
  }

  return best
}

/**
 * Rellena `user_activity_submissions` a partir de los `soflia_dialogue_results`
 * históricos que aún no tienen submission-proxy. Reusa el sync en vivo
 * (`syncDialogueResultToActivitySubmission`) para garantizar EXACTAMENTE la misma
 * forma de datos y recalcular el progreso de la lección. Idempotente: solo crea las
 * faltantes (no toca submissions existentes) y respeta el `unique(user, activity,
 * enrollment)`.
 */
export async function backfillDialogueSubmissions(
  input: BackfillDialogueSubmissionsInput,
): Promise<BackfillDialogueSubmissionsResult> {
  const limit = input.limit ?? DEFAULT_LIMIT

  let resultsQuery = fromLoose<DialogueResultRow>(input.client, 'soflia_dialogue_results')
    .select('result_id, session_id, activity_id, user_id, enrollment_id, payload')
  if (input.userId) resultsQuery = resultsQuery.eq('user_id', input.userId)
  const { data: resultRows } = await resultsQuery.limit(limit)

  let sessionsQuery = fromLoose<DialogueSessionLite>(input.client, 'soflia_dialogue_sessions')
    .select('session_id, activity_id, course_id, lesson_id, enrollment_id, organization_id, user_id')
  if (input.userId) sessionsQuery = sessionsQuery.eq('user_id', input.userId)
  const { data: sessionRows } = await sessionsQuery.limit(limit)

  const sessionById = new Map((sessionRows || []).map((session) => [session.session_id, session]))

  let existingQuery = fromLoose<{ user_id: string; activity_id: string; enrollment_id: string }>(
    input.client,
    'user_activity_submissions',
  ).select('user_id, activity_id, enrollment_id')
  if (input.userId) existingQuery = existingQuery.eq('user_id', input.userId)
  const { data: existingRows } = await existingQuery.limit(limit)
  const existingKeys = new Set(
    (existingRows || []).map((row) => submissionKey(row.user_id, row.activity_id, row.enrollment_id)),
  )

  const bestResults = pickBestResultsPerActivity(resultRows || [])

  let alreadyPresent = 0
  let created = 0
  let skipped = 0
  let failed = 0

  for (const [key, { row, result }] of bestResults) {
    if (existingKeys.has(key)) {
      alreadyPresent += 1
      continue
    }

    const session = sessionById.get(row.session_id)
    if (!session || !session.course_id || !session.lesson_id) {
      skipped += 1
      continue
    }

    if (input.dryRun) {
      created += 1 // en dry-run, "created" representa las que SE crearían
      continue
    }

    const context: CourseActivityContext = {
      activity: { activity_id: session.activity_id },
      courseId: session.course_id,
      courseTitle: '',
      enrollmentId: session.enrollment_id,
      instructorId: null,
      lessonId: session.lesson_id,
      organizationId: session.organization_id,
      organizationAiContext: null,
      resolvedActivityConfig: null,
      userId: session.user_id,
    }

    try {
      await syncDialogueResultToActivitySubmission({
        client: input.client,
        context,
        result,
        session: { session_id: session.session_id } as DialogueSessionRow,
      })
      created += 1
    } catch (error) {
      failed += 1
      logger.error('backfillDialogueSubmissions: sync failed', { resultId: row.result_id, error })
    }
  }

  return {
    dryRun: input.dryRun,
    scannedResults: (resultRows || []).length,
    eligibleActivities: bestResults.size,
    alreadyPresent,
    created,
    skipped,
    failed,
  }
}
