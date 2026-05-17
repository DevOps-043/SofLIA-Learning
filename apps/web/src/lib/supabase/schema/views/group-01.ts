import type { AiModerationPendingReviewView } from './ai-moderation-pending-review.view'
import type { LiaActivityPerformanceView } from './lia-activity-performance.view'
import type { LiaConversationAnalyticsView } from './lia-conversation-analytics.view'
import type { LiaCourseAnalyticsView } from './lia-course-analytics.view'
import type { ModerationStatsView } from './moderation-stats.view'
import type { ReportesConUsuarioView } from './reportes-con-usuario.view'
import type { StudyPlanProgressView } from './study-plan-progress.view'
import type { UserCalendarSubscriptionsView } from './user-calendar-subscriptions.view'
import type { UserUnreadNotificationsView } from './user-unread-notifications.view'
import type { UserUnreadNotificationsCountView } from './user-unread-notifications-count.view'
import type { VAiGeneratedPlansView } from './v-ai-generated-plans.view'
import type { VIncompleteLessonTimesView } from './v-incomplete-lesson-times.view'
import type { VLessonsBySessionTypeCompatibilityView } from './v-lessons-by-session-type-compatibility.view'
import type { VOrganizationStatsView } from './v-organization-stats.view'
import type { VOrganizationUsersDetailedView } from './v-organization-users-detailed.view'
import type { VSessionTypeDistributionView } from './v-session-type-distribution.view'
import type { VUserSecuritySummaryView } from './v-user-security-summary.view'

export type PublicViewsGroup01 = {
  ai_moderation_pending_review: AiModerationPendingReviewView
  lia_activity_performance: LiaActivityPerformanceView
  lia_conversation_analytics: LiaConversationAnalyticsView
  lia_course_analytics: LiaCourseAnalyticsView
  moderation_stats: ModerationStatsView
  reportes_con_usuario: ReportesConUsuarioView
  study_plan_progress: StudyPlanProgressView
  user_calendar_subscriptions: UserCalendarSubscriptionsView
  user_unread_notifications: UserUnreadNotificationsView
  user_unread_notifications_count: UserUnreadNotificationsCountView
  v_ai_generated_plans: VAiGeneratedPlansView
  v_incomplete_lesson_times: VIncompleteLessonTimesView
  v_lessons_by_session_type_compatibility: VLessonsBySessionTypeCompatibilityView
  v_organization_stats: VOrganizationStatsView
  v_organization_users_detailed: VOrganizationUsersDetailedView
  v_session_type_distribution: VSessionTypeDistributionView
  v_user_security_summary: VUserSecuritySummaryView
}
