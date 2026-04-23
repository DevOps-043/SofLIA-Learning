import type { CourseLessonContext } from '../../../../core/types/lia.types'
import type {
  LearnActivitySummary,
  LearnTab,
} from '../../components/learn/types'

export function buildActivitiesContext(params: {
  activeTab?: LearnTab
  currentActivities?: LearnActivitySummary[]
  currentActivityPrompts?: string[]
}): CourseLessonContext['activitiesContext'] {
  const { activeTab, currentActivities, currentActivityPrompts } = params

  if (!currentActivities) {
    return undefined
  }

  const requiredActivities = currentActivities.filter(
    (activity) => activity.is_required,
  )
  const pendingRequired = requiredActivities.filter(
    (activity) => !activity.is_completed,
  )
  const completedActivities = currentActivities.filter(
    (activity) => activity.is_completed,
  )
  const fallbackFocus = pendingRequired[0] || currentActivities[0] || null
  const shouldAttachPrompts =
    activeTab === 'activities' &&
    Array.isArray(currentActivityPrompts) &&
    currentActivityPrompts.length > 0

  return {
    totalActivities: currentActivities.length,
    requiredActivities: requiredActivities.length,
    completedActivities: completedActivities.length,
    pendingRequiredCount: pendingRequired.length,
    pendingRequiredTitles: pendingRequired
      .map((activity) => activity.activity_title)
      .join(', '),
    activityTypes: currentActivities.map((activity) => ({
      title: activity.activity_title,
      type: activity.activity_type,
      description: activity.activity_description,
      isRequired: activity.is_required,
      isCompleted: !!activity.is_completed,
    })),
    currentActivityFocus:
      activeTab === 'activities' && fallbackFocus
        ? {
            title: fallbackFocus.activity_title,
            type: fallbackFocus.activity_type,
            isRequired: fallbackFocus.is_required,
            isCompleted: !!fallbackFocus.is_completed,
            description:
              fallbackFocus.activity_description || fallbackFocus.activity_title,
            prompts: shouldAttachPrompts ? currentActivityPrompts : undefined,
          }
        : null,
  }
}
