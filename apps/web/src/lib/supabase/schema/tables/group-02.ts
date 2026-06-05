import type { CourseReviewsTable } from './course-reviews.table'
import type { CoursesTable } from './courses.table'
import type { DailyProgressTable } from './daily-progress.table'
import type { DashboardLayoutsTable } from './dashboard-layouts.table'
import type { ForbiddenWordsTable } from './forbidden-words.table'
import type { LessonActivitiesTable } from './lesson-activities.table'
import type { LessonCheckpointsTable } from './lesson-checkpoints.table'
import type { LessonFeedbackTable } from './lesson-feedback.table'
import type { LessonMaterialsTable } from './lesson-materials.table'
import type { LessonTimeEstimatesTable } from './lesson-time-estimates.table'
import type { LessonTrackingTable } from './lesson-tracking.table'
import type { LiaActivityCompletionsTable } from './lia-activity-completions.table'
import type { LiaCommonQuestionsTable } from './lia-common-questions.table'
import type { LiaConversationsTable } from './lia-conversations.table'
import type { LiaLiveSessionsTable } from './lia-live-sessions.table'
import type { LiaLiveTranscriptEntriesTable } from './lia-live-transcript-entries.table'
import type { LiaMessagesTable } from './lia-messages.table'
import type { LiaMessagesTokensTmpTable } from './lia-messages-tokens-tmp.table'
import type { LiaUserFeedbackTable } from './lia-user-feedback.table'
import type { NivelesTable } from './niveles.table'
import type { NotificationEmailQueueTable } from './notification-email-queue.table'
import type { NotificationPushSubscriptionsTable } from './notification-push-subscriptions.table'

export type PublicTablesGroup02 = {
  course_reviews: CourseReviewsTable
  courses: CoursesTable
  daily_progress: DailyProgressTable
  dashboard_layouts: DashboardLayoutsTable
  forbidden_words: ForbiddenWordsTable
  lesson_activities: LessonActivitiesTable
  lesson_checkpoints: LessonCheckpointsTable
  lesson_feedback: LessonFeedbackTable
  lesson_materials: LessonMaterialsTable
  lesson_time_estimates: LessonTimeEstimatesTable
  lesson_tracking: LessonTrackingTable
  lia_activity_completions: LiaActivityCompletionsTable
  lia_common_questions: LiaCommonQuestionsTable
  lia_conversations: LiaConversationsTable
  lia_live_sessions: LiaLiveSessionsTable
  lia_live_transcript_entries: LiaLiveTranscriptEntriesTable
  lia_messages: LiaMessagesTable
  lia_messages_tokens_tmp: LiaMessagesTokensTmpTable
  lia_user_feedback: LiaUserFeedbackTable
  niveles: NivelesTable
  notification_email_queue: NotificationEmailQueueTable
  notification_push_subscriptions: NotificationPushSubscriptionsTable
}
