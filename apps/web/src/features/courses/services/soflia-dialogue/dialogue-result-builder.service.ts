import type {
  DialogueActivityConfig,
  DialogueEvaluationResult,
  DialogueSessionResult,
} from '../../types/dialogue-runtime'

function buildStudentFeedback(input: {
  config: DialogueActivityConfig
  evaluation: DialogueEvaluationResult
  completed: boolean
}) {
  if (input.completed) {
    return input.evaluation.feedbackForTutor
      ? `Actividad completada. ${input.evaluation.feedbackForTutor}`
      : 'Actividad completada. Tu respuesta muestra comprension suficiente del escenario.'
  }

  return input.evaluation.feedbackForTutor
    ? `Necesitas reintentar. ${input.evaluation.feedbackForTutor}`
    : `Necesitas reintentar. Revisa este modelo de referencia: ${input.config.rescueContent}`
}

export function buildDialogueSessionResult(input: {
  config: DialogueActivityConfig
  evaluation: DialogueEvaluationResult
  completed: boolean
}): DialogueSessionResult {
  return {
    activityResult: input.completed ? 'completed' : 'needs_retry',
    analyticsTags: [
      input.completed ? 'dialogue_completed' : 'dialogue_needs_retry',
      input.evaluation.criteriaMissing.length > 0 ? 'criteria_missing' : 'criteria_met',
    ],
    criteriaMet: input.evaluation.criteriaMet,
    criteriaMissing: input.evaluation.criteriaMissing,
    evidenceQuotes: input.evaluation.evidenceQuotes,
    instructorSummary: input.evaluation.backendNotes,
    recommendations: input.evaluation.criteriaMissing.map(
      (criterionId) => `Reforzar criterio: ${criterionId}`,
    ),
    score: input.evaluation.overallScore,
    studentFeedback: buildStudentFeedback(input),
  }
}
