import { ActivityEvaluationRecord } from './activity-evaluation-record'

export function buildLatestEvaluationBySubmission(
  evaluations: ActivityEvaluationRecord[],
): Map<string, ActivityEvaluationRecord> {
  const map = new Map<string, ActivityEvaluationRecord>()
  evaluations.forEach((evaluation) => {
    if (!map.has(evaluation.submission_id)) {
      map.set(evaluation.submission_id, evaluation)
    }
  })
  return map
}
