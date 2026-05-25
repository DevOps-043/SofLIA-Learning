import type { ActivityEvaluationRecord } from './activity-evaluation-record'

export function buildLatestActivityEvaluationBySubmission(
  evaluations: ActivityEvaluationRecord[],
): Map<string, ActivityEvaluationRecord> {
  return evaluations
    .filter((evaluation) => Boolean(evaluation.submission_id))
    .sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0
      return bTime - aTime
    })
    .reduce((map, evaluation) => {
      if (!map.has(evaluation.submission_id)) {
        map.set(evaluation.submission_id, evaluation)
      }
      return map
    }, new Map<string, ActivityEvaluationRecord>())
}
