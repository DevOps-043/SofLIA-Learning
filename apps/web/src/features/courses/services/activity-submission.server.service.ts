export {
  CourseActivityError,
  type CourseActivityErrorCode,
} from './activity-submission/course-activity-error'
export type {
  ActivityEvaluationRow,
  ActivityLikeRecord,
  ActivitySubmissionRow,
  CourseActivityContext,
  CourseLessonContext,
  LessonActivityProgressSummary,
  SupabaseServerClient,
} from './activity-submission/activity-submission.types'
export {
  getChecklistMap,
  getEvidenceText,
  getInlineAnswerMap,
  getPayloadText,
  hasAnyActivityResponse,
  normalizeText,
  toRecord,
} from './activity-submission/activity-submission-payload.utils'
export { isActivitySubmissionCompletionSatisfied } from './activity-submission/activity-submission-completion.service'
export { createActivitySubmissionSummary } from './activity-submission/activity-submission-summary.service'
export { resolveCourseLessonContext } from './activity-submission/course-lesson-context.server'
export { resolveCourseActivityContext } from './activity-submission/course-activity-context.server'
export { buildActivitySubmissionSummaryMap } from './activity-submission/activity-submission-summary-map.server'
export { getActivitySubmissionDetail } from './activity-submission/activity-submission-detail.server'
export { saveActivitySubmission } from './activity-submission/activity-submission-save.server'
export { computeLessonActivityProgress } from './activity-submission/lesson-activity-progress-summary.server'
export { recalculateLessonActivityProgress } from './activity-submission/lesson-progress-upsert.server'
