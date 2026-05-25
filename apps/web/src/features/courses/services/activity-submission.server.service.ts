export {
  hasAnyActivityResponse,
  isActivitySubmissionCompletionSatisfied,
} from './activity-submission/completion'
export {
  resolveCourseActivityContext,
  resolveCourseLessonContext,
} from './activity-submission/context'
export {
  CourseActivityError,
  type CourseActivityErrorCode,
} from './activity-submission/error'
export {
  createActivitySubmissionSummary,
  loadLatestEvaluationMap,
} from './activity-submission/evaluations'
export { getActivitySubmissionDetail } from './activity-submission/detail'
export { persistActivitySubmissionPayload } from './activity-submission/persistence'
export {
  computeLessonActivityProgress,
  type LessonActivityProgressSummary,
} from './activity-submission/progress-compute'
export { recalculateLessonActivityProgress } from './activity-submission/progress-recalculate'
export { saveActivitySubmission } from './activity-submission/save'
export { buildActivitySubmissionSummaryMap } from './activity-submission/summary-map'
export type {
  ActivityEvaluationRow,
  ActivityLikeRecord,
  ActivitySubmissionMutationPayload,
  ActivitySubmissionRow,
  CourseActivityContext,
  CourseLessonContext,
  SupabaseServerClient,
} from './activity-submission/types'
