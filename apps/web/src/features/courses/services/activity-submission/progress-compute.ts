import { logger } from '@/lib/utils/logger'

import {
  isInteractiveLessonActivity,
  resolveActivityConfigFromRecord,
} from '../activity-content-compatibility.service'

import { buildActivitySubmissionSummaryMap } from './summary-map'
import type {
  ActivityLikeRecord,
  CourseLessonContext,
  SupabaseServerClient,
} from './types'

export type LessonActivityProgressSummary = {
  activityProgressPercentage: number
  lastActivitySubmissionAt: string | null
  requiredActivitiesCompleted: number
  requiredActivitiesTotal: number
}

function getLatestSubmissionTimestamp(
  submissions: Array<{ submitted_at: string | null; updated_at: string | null }>,
) {
  return submissions.reduce<string | null>((latest, submission) => {
    const candidate = submission.submitted_at || submission.updated_at
    if (!candidate) return latest
    if (!latest) return candidate
    return candidate > latest ? candidate : latest
  }, null)
}

export async function computeLessonActivityProgress(
  supabase: SupabaseServerClient,
  context: CourseLessonContext,
): Promise<LessonActivityProgressSummary> {
  const { data: activities } = await supabase
    .from('lesson_activities')
    .select(
      'activity_id, activity_type, is_required, activity_config, requires_soflia_validation, external_tool_key, activity_content, ai_prompts',
    )
    .eq('lesson_id', context.lessonId)
    .order('activity_order_index', { ascending: true })

  const activityRecords = (activities || []) as ActivityLikeRecord[]
  const resolvedActivities = activityRecords.map((activity) => ({
    activity,
    config: resolveActivityConfigFromRecord(activity),
  }))

  const interactiveActivities = resolvedActivities
    .filter((entry) => Boolean(entry.config))
    .map((entry) => entry.activity)
  // Las actividades SofLIA Dialogue gatean el avance POR DISEÑO: completarlas exige
  // una evaluación >= 60% del modelo (ver SOFLIA_DIALOGUE_APPROVAL_MINIMUM). Se tratan
  // como requeridas aunque `is_required` sea false, para que "solo iniciarlas" no
  // permita continuar a la siguiente lección.
  const requiredActivities = resolvedActivities
    .filter(
      (entry) =>
        Boolean(entry.config) &&
        (Boolean(entry.activity.is_required) ||
          entry.config?.interactionType === 'soflia_dialogue'),
    )
    .map((entry) => entry.activity)

  // FAIL-CLOSED: una actividad interactiva REQUERIDA (p.ej. SofLIA Dialogue) cuya
  // config NO se puede resolver no debe excluirse silenciosamente del gate — eso
  // permitiría avanzar sin completarla. La contamos como requerida-no-completada y
  // lo registramos. Lectura/reflexión/quiz/ai_chat no son interactivas por diseño y
  // se gatean por otras rutas (o no aplican), por lo que quedan fuera de esta regla.
  const unresolvedRequiredGatedActivities = resolvedActivities
    .filter(
      (entry) =>
        !entry.config &&
        Boolean(entry.activity.is_required) &&
        isInteractiveLessonActivity(entry.activity.activity_type),
    )
    .map((entry) => entry.activity)

  for (const activity of unresolvedRequiredGatedActivities) {
    logger.error(
      'computeLessonActivityProgress: actividad interactiva requerida con config no resoluble; se bloquea el avance (fail-closed)',
      {
        activityId: activity.activity_id,
        activityType: activity.activity_type,
        lessonId: context.lessonId,
      },
    )
  }

  const blockedRequiredCount = unresolvedRequiredGatedActivities.length

  if (interactiveActivities.length === 0 && blockedRequiredCount === 0) {
    return {
      activityProgressPercentage: 100,
      lastActivitySubmissionAt: null,
      requiredActivitiesCompleted: 0,
      requiredActivitiesTotal: 0,
    }
  }

  const summaryMap = await buildActivitySubmissionSummaryMap(
    supabase,
    context,
    interactiveActivities,
  )
  const requiredActivitiesCompleted = requiredActivities.filter((activity) => {
    return summaryMap.get(activity.activity_id)?.completionSatisfied === true
  }).length

  const { data: submissions } = await supabase
    .from('user_activity_submissions')
    .select('submitted_at, updated_at')
    .eq('user_id', context.userId)
    .eq('lesson_id', context.lessonId)
    .eq('enrollment_id', context.enrollmentId)

  // Las bloqueadas suman al total pero nunca a las completadas (nunca fail-open).
  const requiredActivitiesTotal = requiredActivities.length + blockedRequiredCount
  const activityProgressPercentage =
    requiredActivitiesTotal === 0
      ? 100
      : Math.round(
          (requiredActivitiesCompleted / requiredActivitiesTotal) * 100 * 100,
        ) / 100

  return {
    activityProgressPercentage,
    lastActivitySubmissionAt: getLatestSubmissionTimestamp(submissions || []),
    requiredActivitiesCompleted,
    requiredActivitiesTotal,
  }
}
