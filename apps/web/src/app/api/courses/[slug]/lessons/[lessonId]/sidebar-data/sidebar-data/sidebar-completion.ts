import { buildActivitySubmissionSummaryMap } from '@/features/courses/services/activity-submission.server.service'
import type { ActivitySubmissionSummary } from '@/features/courses/types/activity-config'
import type { SidebarDataBundle } from './sidebar-results.types'
import type { LessonActivityRow, QuizProgressRow, SidebarContext } from './sidebar.types'

function collectCompletionIds(
  activityIds: string[],
  data: SidebarDataBundle,
) {
  const liaCompletions = data.liaCompletions.filter((completion) =>
    activityIds.includes(completion.activity_id),
  )
  const quizProgress = data.quizProgress.filter(
    (submission) => submission.activity_id !== null && activityIds.includes(submission.activity_id),
  )

  return new Set<string>([
    ...liaCompletions
      .filter((completion) => completion.status === 'completed')
      .map((completion) => completion.activity_id),
    ...quizProgress
      .filter(
        (submission): submission is QuizProgressRow & { activity_id: string } =>
          Boolean(submission.is_passed && submission.activity_id),
      )
      .map((submission) => submission.activity_id),
  ])
}

export interface ActivityCompletionState {
  completedActivityIds: Set<string>
  submissionSummaryMap: Map<string, ActivitySubmissionSummary>
}

export async function buildActivityCompletionState(
  context: SidebarContext,
  activities: LessonActivityRow[],
  data: SidebarDataBundle,
): Promise<ActivityCompletionState> {
  const completedActivityIds = collectCompletionIds(
    activities.map((activity) => activity.activity_id),
    data,
  )

  const submissionSummaryMap = await buildActivitySubmissionSummaryMap(
    context.supabase,
    {
      courseId: context.course.id,
      courseTitle: typeof context.course.title === 'string' ? context.course.title : 'Curso',
      enrollmentId: context.enrollment.enrollment_id,
      instructorId: typeof context.course.instructor_id === 'string' ? context.course.instructor_id : null,
      lessonId: context.resolvedLessonId,
      organizationId: context.enrollment.organization_id ?? context.organizationId ?? null,
      userId: context.currentUser.id,
    },
    activities,
  )

  submissionSummaryMap.forEach((summary, activityId) => {
    if (summary.completionSatisfied) completedActivityIds.add(activityId)
  })

  return {
    completedActivityIds,
    submissionSummaryMap,
  }
}
