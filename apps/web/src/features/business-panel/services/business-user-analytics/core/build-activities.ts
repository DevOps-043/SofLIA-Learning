import type { BusinessUserAnalyticsPeriod } from '../../../types/business-user-analytics.types'
import { buildBreakdown, calculateAverage, calculatePercentage, incrementMap } from '../../reports-analytics/reports-analytics.helpers'
import { ActivityEvaluationRecord } from './activity-evaluation-record'
import { buildActivityProgressFallback } from './build-activity-progress-fallback'
import { buildDialogueActivityMetrics, dialogueActivityKey } from './dialogue-activity-metrics'
import { buildTrend } from './build-trend'
import { extractSubmissionText } from './extract-submission-text'
import { isActivityCompletionSatisfied } from './is-activity-completion-satisfied'
import { QueryData } from './query-data'
import { scoreEvaluationStatus } from './score-evaluation-status'

export function buildActivities(
  data: QueryData,
  period: BusinessUserAnalyticsPeriod,
  evaluationsBySubmission: Map<string, ActivityEvaluationRecord>,
  completedCourseIds: Set<string>,
) {
  // Fuente AUTORITATIVA de las actividades de diálogo (`ai_chat`): score, aprobación
  // y feedback reales viven en `soflia_dialogue_results`/`sessions`, no en el proxy
  // de `user_activity_submissions`.
  const dialogue = buildDialogueActivityMetrics(data.dialogueResults, data.dialogueSessions)

  // Las submissions de actividades de diálogo son un PROXY (1 fila por actividad+
  // enrollment) que se sincroniza desde el resultado; se excluyen aquí para no
  // doble-contar: la métrica de esas actividades sale de `dialogue`.
  const nonDialogueSubmissions = data.activitySubmissions.filter(
    (submission) => !dialogue.keys.has(dialogueActivityKey(submission.activity_id, submission.enrollment_id)),
  )
  const submittedNonDialogue = nonDialogueSubmissions.filter((submission) => submission.status !== 'draft')

  // Las completions legacy (`lia_activity_completions`) solo cuentan si su actividad
  // no está ya cubierta por una entrega no-diálogo NI por un resultado de diálogo.
  const completedActivityIds = new Set<string>([
    ...submittedNonDialogue.map((submission) => submission.activity_id),
    ...data.dialogueResults.map((result) => result.activity_id),
  ])
  const completedSofliaActivities = data.activityCompletions.filter((completion) =>
    isActivityCompletionSatisfied(completion) && !completedActivityIds.has(completion.activity_id),
  )

  // El fallback por progreso de lección solo aplica si NO hay ninguna señal real.
  const activityProgressFallback = buildActivityProgressFallback(
    data.lessonProgress,
    data.lessonActivities,
    data.courseLessons,
    completedCourseIds,
    submittedNonDialogue.length === 0 &&
      dialogue.entregas === 0 &&
      completedSofliaActivities.length === 0,
  )

  const validatedNonDialogue = nonDialogueSubmissions.filter((submission) => submission.status === 'validated').length
  const needsRevisionNonDialogue = nonDialogueSubmissions.filter((submission) => submission.status === 'needs_revision').length

  const evaluationScores = submittedNonDialogue.map((submission) => {
    const evaluation = evaluationsBySubmission.get(submission.submission_id)
    if (evaluation) return scoreEvaluationStatus(evaluation.result_status)
    if (submission.status === 'validated') return 100
    if (submission.status === 'needs_revision') return 55
    // Entregada pero SIN validar aún: no asumir calidad perfecta (antes 100, lo que
    // inflaba el score cuando la mayoría no estaban validadas).
    return 60
  })

  const statusCounts = new Map<string, number>()
  nonDialogueSubmissions.forEach((submission) => incrementMap(statusCounts, submission.status || 'draft'))
  if (dialogue.passes > 0) incrementMap(statusCounts, 'completed', dialogue.passes)
  if (dialogue.needsRevision > 0) incrementMap(statusCounts, 'needs_revision', dialogue.needsRevision)
  if (dialogue.inProgress > 0) incrementMap(statusCounts, 'in_progress', dialogue.inProgress)
  completedSofliaActivities.forEach((completion) => incrementMap(statusCounts, completion.status || 'completed'))
  if (activityProgressFallback.completed > 0) {
    incrementMap(statusCounts, 'completed', activityProgressFallback.completed)
  }
  if (activityProgressFallback.total > activityProgressFallback.completed) {
    incrementMap(statusCounts, 'in_progress', activityProgressFallback.total - activityProgressFallback.completed)
  }

  const directPassesNonDialogue = submittedNonDialogue.filter((submission) => {
    const evaluation = evaluationsBySubmission.get(submission.submission_id)
    if (evaluation) return evaluation.result_status === 'pass'
    return submission.status === 'validated' || submission.status === 'completed'
  }).length

  const totalEvaluatedOrCompleted =
    dialogue.entregas +
    submittedNonDialogue.length +
    completedSofliaActivities.length +
    activityProgressFallback.total
  const qualityScores = [
    ...dialogue.qualityScores,
    ...evaluationScores,
    ...completedSofliaActivities.map(() => 100),
    ...activityProgressFallback.scores,
  ]
  // `dialogue.entregas` ya incluye las entregas en progreso (con interacción real),
  // así que NO se vuelve a sumar `dialogue.inProgress` (evita doble conteo).
  const totalActivitySignals =
    dialogue.entregas +
    nonDialogueSubmissions.length +
    completedSofliaActivities.length +
    activityProgressFallback.total
  const completedActivitySignals =
    dialogue.entregas +
    submittedNonDialogue.length +
    completedSofliaActivities.length +
    activityProgressFallback.completed

  return {
    totalSubmissions: completedActivitySignals,
    submitted: completedActivitySignals,
    validated: validatedNonDialogue + dialogue.passes + completedSofliaActivities.length + activityProgressFallback.completed,
    needsRevision: needsRevisionNonDialogue + dialogue.needsRevision,
    passRate: calculatePercentage(
      dialogue.passes + directPassesNonDialogue + completedSofliaActivities.length + activityProgressFallback.completed,
      totalEvaluatedOrCompleted,
    ),
    averageQualityScore: calculateAverage(qualityScores),
    averageResponseLength: calculateAverage(nonDialogueSubmissions.map((submission) => extractSubmissionText(submission).length)),
    withSofliaFeedback: dialogue.withFeedback + evaluationsBySubmission.size + completedSofliaActivities.length,
    statusBreakdown: buildBreakdown(statusCounts, totalActivitySignals || completedActivitySignals),
    submissionsTrend: buildTrend([
      ...nonDialogueSubmissions.map((submission) => submission.submitted_at || submission.updated_at),
      ...dialogue.trendDates,
      ...completedSofliaActivities.map((completion) => completion.completed_at || completion.updated_at || completion.started_at),
      ...activityProgressFallback.dates,
    ].filter((value): value is string => Boolean(value)), period),
  }
}
