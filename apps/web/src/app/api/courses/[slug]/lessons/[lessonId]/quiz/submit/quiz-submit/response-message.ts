export function buildQuizAttemptMessage(params: {
  existingSubmission: unknown
  isPassed: boolean
  previousPassed: boolean
  previousScore: number
  shouldPersistAttempt: boolean
  didImproveBestScore: boolean
}) {
  const { existingSubmission, isPassed, previousPassed, previousScore, shouldPersistAttempt, didImproveBestScore } = params

  if (!shouldPersistAttempt && existingSubmission) {
    return `Ya habias aprobado este quiz con ${previousScore}%. Este intento no reemplazo tu intento aprobado.`
  }
  if (existingSubmission && !isPassed && !previousPassed && !didImproveBestScore) {
    return `Intento guardado. Tu mejor puntaje sigue siendo ${previousScore}%.`
  }
  if (isPassed) return 'Quiz aprobado.'
  return 'Quiz completado, pero no alcanzaste el 80% requerido. Puedes intentarlo de nuevo para mejorar tu puntaje.'
}
