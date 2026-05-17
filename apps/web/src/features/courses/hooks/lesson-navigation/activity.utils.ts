import type { LearnActivitySummary } from '../../components/learn/types'

function requiresActivityCompletion(activity: LearnActivitySummary): boolean {
  return activity.activity_type !== 'reflection'
}

export function getIncompleteActivities(
  activities?: LearnActivitySummary[] | null,
): LearnActivitySummary[] {
  return (activities ?? []).filter((activity) => !activity.is_completed)
}

export function hasIncompleteActivities(
  activities?: LearnActivitySummary[] | null,
): boolean {
  return getIncompleteActivities(activities).length > 0
}

export function getPendingRequiredActivities(
  activities?: LearnActivitySummary[] | null,
): LearnActivitySummary[] {
  return getIncompleteActivities(activities).filter(
    (activity) => activity.is_required && requiresActivityCompletion(activity),
  )
}
