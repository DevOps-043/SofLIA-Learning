import type { ApproveCommunityCreationRequestFunction } from './approve-community-creation-request.function'
import type { CalculateCourseComplexityFunction } from './calculate-course-complexity.function'
import type { CalculateCourseDurationFunction } from './calculate-course-duration.function'
import type { CalculateLessonTotalTimeFunction } from './calculate-lesson-total-time.function'
import type { CalculateModuleDurationFunction } from './calculate-module-duration.function'
import type { CalculateReelCommentCountFunction } from './calculate-reel-comment-count.function'
import type { CanAssignCoursesFunction } from './can-assign-courses.function'
import type { CanOrganizationPurchaseCourseFunction } from './can-organization-purchase-course.function'
import type { CertificateHashImmutableFunction } from './certificate-hash-immutable.function'
import type { CheckB2bDeadlinesFunction } from './check-b2b-deadlines.function'
import type { CheckUserIsOrgAdminFunction } from './check-user-is-org-admin.function'
import type { CheckUserOrgMembershipFunction } from './check-user-org-membership.function'
import type { CleanExpiredRefreshTokensFunction } from './clean-expired-refresh-tokens.function'
import type { CleanupExpiredInvitationsFunction } from './cleanup-expired-invitations.function'
import type { CleanupExpiredRefreshTokensFunction } from './cleanup-expired-refresh-tokens.function'
import type { CleanupOldCommunityDataFunction } from './cleanup-old-community-data.function'
import type { CloseConversationFunction } from './close-conversation.function'
import type { ContainsForbiddenContentFunction } from './contains-forbidden-content.function'
import type { CountActiveUsersFunction } from './count-active-users.function'
import type { DecrementCommentCountFunction } from './decrement-comment-count.function'

export type PublicFunctionsGroup01 = {
  approve_community_creation_request: ApproveCommunityCreationRequestFunction
  calculate_course_complexity: CalculateCourseComplexityFunction
  calculate_course_duration: CalculateCourseDurationFunction
  calculate_lesson_total_time: CalculateLessonTotalTimeFunction
  calculate_module_duration: CalculateModuleDurationFunction
  calculate_reel_comment_count: CalculateReelCommentCountFunction
  can_assign_courses: CanAssignCoursesFunction
  can_organization_purchase_course: CanOrganizationPurchaseCourseFunction
  certificate_hash_immutable: CertificateHashImmutableFunction
  check_b2b_deadlines: CheckB2bDeadlinesFunction
  check_user_is_org_admin: CheckUserIsOrgAdminFunction
  check_user_org_membership: CheckUserOrgMembershipFunction
  clean_expired_refresh_tokens: CleanExpiredRefreshTokensFunction
  cleanup_expired_invitations: CleanupExpiredInvitationsFunction
  cleanup_expired_refresh_tokens: CleanupExpiredRefreshTokensFunction
  cleanup_old_community_data: CleanupOldCommunityDataFunction
  close_conversation: CloseConversationFunction
  contains_forbidden_content: ContainsForbiddenContentFunction
  count_active_users: CountActiveUsersFunction
  decrement_comment_count: DecrementCommentCountFunction
}
