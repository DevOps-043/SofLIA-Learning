import { buildActivitySubmissionSummaryMap } from '@/features/courses/services/activity-submission.server.service'
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

export async function buildCompletedActivityIds(
  context: SidebarContext,
  activities: LessonActivityRow[],
  data: SidebarDataBundle,
) {
  const completedActivityIds = collectCompletionIds(
    activities.map((activity) => activity.activity_id),
    data,
  )

  if (!context.currentUser || !data.enrollment) return completedActivityIds

  const activitySubmissionSummaryMap = await buildActivitySubmissionSummaryMap(
    context.supabase,
    {
      courseId: context.course.id,
      courseTitle: typeof context.course.title === 'string' ? context.course.title : 'Curso',
      enrollmentId: data.enrollment.enrollment_id,
      instructorId: typeof context.course.instructor_id === 'string' ? context.course.instructor_id : null,
      lessonId: context.resolvedLessonId,
      organizationId: data.enrollment.organization_id ?? context.organizationId ?? null,
      userId: context.currentUser.id,
    },
    activities,
  )

  activitySubmissionSummaryMap.forEach((summary, activityId) => {
    if (summary.completionSatisfied) completedActivityIds.add(activityId)
  })

  return completedActivityIds
}
