import type { GetUserSkillsFunction } from './get-user-skills.function'
import type { GetUserWarningHistoryFunction } from './get-user-warning-history.function'
import type { GetUserWarningsCountFunction } from './get-user-warnings-count.function'
import type { GetUnreadNotificationsCountFunction } from './get-unread-notifications-count.function'
import type { IsActiveTeamMemberFunction } from './is-active-team-member.function'
import type { IsTeamLeaderOrColeaderFunction } from './is-team-leader-or-coleader.function'
import type { IsUserBannedFunction } from './is-user-banned.function'
import type { LedgerBlockHashImmutableFunction } from './ledger-block-hash-immutable.function'
import type { LogLiaMessageFunction } from './log-lia-message.function'
import type { RefreshCommunityMaterializedViewsFunction } from './refresh-community-materialized-views.function'
import type { RegenerateSubscriptionTokenFunction } from './regenerate-subscription-token.function'
import type { RegisterAiModerationAnalysisFunction } from './register-ai-moderation-analysis.function'
import type { RegisterUserWarningFunction } from './register-user-warning.function'
import type { RejectCommunityCreationRequestFunction } from './reject-community-creation-request.function'
import type { RevokeAllUserTokensFunction } from './revoke-all-user-tokens.function'
import type { RevokeCertificateFunction } from './revoke-certificate.function'
import type { UpdateAllReelCommentCountsFunction } from './update-all-reel-comment-counts.function'
import type { UpdateLessonTimeEstimateFunction } from './update-lesson-time-estimate.function'
import type { UpdateReelCommentCountFunction } from './update-reel-comment-count.function'
import type { UpdateTokenUsageFunction } from './update-token-usage.function'
import type { ValidateCertificateFunction } from './validate-certificate.function'

export type PublicFunctionsGroup03 = {
  get_unread_notifications_count: GetUnreadNotificationsCountFunction
  get_user_skills: GetUserSkillsFunction
  get_user_warning_history: GetUserWarningHistoryFunction
  get_user_warnings_count: GetUserWarningsCountFunction
  is_active_team_member: IsActiveTeamMemberFunction
  is_team_leader_or_coleader: IsTeamLeaderOrColeaderFunction
  is_user_banned: IsUserBannedFunction
  ledger_block_hash_immutable: LedgerBlockHashImmutableFunction
  log_lia_message: LogLiaMessageFunction
  refresh_community_materialized_views: RefreshCommunityMaterializedViewsFunction
  regenerate_subscription_token: RegenerateSubscriptionTokenFunction
  register_ai_moderation_analysis: RegisterAiModerationAnalysisFunction
  register_user_warning: RegisterUserWarningFunction
  reject_community_creation_request: RejectCommunityCreationRequestFunction
  revoke_all_user_tokens: RevokeAllUserTokensFunction
  revoke_certificate: RevokeCertificateFunction
  update_all_reel_comment_counts: UpdateAllReelCommentCountsFunction
  update_lesson_time_estimate: UpdateLessonTimeEstimateFunction
  update_reel_comment_count: UpdateReelCommentCountFunction
  update_token_usage: UpdateTokenUsageFunction
  validate_certificate: ValidateCertificateFunction
}
