import { ActivityCompletionRecord } from './activity-completion-record'

export function isActivityCompletionSatisfied(completion: ActivityCompletionRecord): boolean {
  const status = completion.status?.toLowerCase()
  if (status === 'completed' || status === 'done') return true
  const completedSteps = Number(completion.completed_steps)
  const totalSteps = Number(completion.total_steps)
  return Number.isFinite(completedSteps) && Number.isFinite(totalSteps) && totalSteps > 0 && completedSteps >= totalSteps
}
