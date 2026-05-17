import type { DeleteUserCascadeFunction } from './delete-user-cascade.function'
import type { DetectSuspiciousTokenActivityFunction } from './detect-suspicious-token-activity.function'
import type { ExpireCertificateFunction } from './expire-certificate.function'
import type { ExtractTeamIdFromPathFunction } from './extract-team-id-from-path.function'
import type { GenerateTeamSlugFunction } from './generate-team-slug.function'
import type { GetAiModerationStatsFunction } from './get-ai-moderation-stats.function'
import type { GetCommentsWithUserDataFunction } from './get-comments-with-user-data.function'
import type { GetDashboardStatsFunction } from './get-dashboard-stats.function'
import type { GetEntityTranslationsFunction } from './get-entity-translations.function'
import type { GetOrCreateSubscriptionTokenFunction } from './get-or-create-subscription-token.function'
import type { GetOrganizationMonthlyCourseCountFunction } from './get-organization-monthly-course-count.function'
import type { GetPostsWithStatsFunction } from './get-posts-with-stats.function'
import type { GetReactionsSummaryFunction } from './get-reactions-summary.function'
import type { GetReelsWithStatsFunction } from './get-reels-with-stats.function'
import type { GetReportesStatsFunction } from './get-reportes-stats.function'
import type { GetSessionTypeDurationRangeFunction } from './get-session-type-duration-range.function'
import type { GetTranslationFunction } from './get-translation.function'
import type { GetUserPrimaryOrgFunction } from './get-user-primary-org.function'
import type { GetUserPrimaryOrganizationFunction } from './get-user-primary-organization.function'
import type { GetUserSkillLevelFunction } from './get-user-skill-level.function'

export type PublicFunctionsGroup02 = {
  delete_user_cascade: DeleteUserCascadeFunction
  detect_suspicious_token_activity: DetectSuspiciousTokenActivityFunction
  expire_certificate: ExpireCertificateFunction
  extract_team_id_from_path: ExtractTeamIdFromPathFunction
  generate_team_slug: GenerateTeamSlugFunction
  get_ai_moderation_stats: GetAiModerationStatsFunction
  get_comments_with_user_data: GetCommentsWithUserDataFunction
  get_dashboard_stats: GetDashboardStatsFunction
  get_entity_translations: GetEntityTranslationsFunction
  get_or_create_subscription_token: GetOrCreateSubscriptionTokenFunction
  get_organization_monthly_course_count: GetOrganizationMonthlyCourseCountFunction
  get_posts_with_stats: GetPostsWithStatsFunction
  get_reactions_summary: GetReactionsSummaryFunction
  get_reels_with_stats: GetReelsWithStatsFunction
  get_reportes_stats: GetReportesStatsFunction
  get_session_type_duration_range: GetSessionTypeDurationRangeFunction
  get_translation: GetTranslationFunction
  get_user_primary_org: GetUserPrimaryOrgFunction
  get_user_primary_organization: GetUserPrimaryOrganizationFunction
  get_user_skill_level: GetUserSkillLevelFunction
}
