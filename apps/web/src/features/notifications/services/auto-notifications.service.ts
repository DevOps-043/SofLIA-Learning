/**
 * AutoNotificationsService — backward-compatible orchestrator.
 *
 * All logic has been extracted into focused service files:
 *   - auto-notifications-system.service.ts    (auth & profile)
 *   - auto-notifications-community.service.ts (communities)
 *   - auto-notifications-courses.service.ts   (courses)
 *   - auto-notifications-content.service.ts   (news, reels, prompts)
 *
 * This file re-exports everything so existing import paths keep working.
 */

export { SystemNotificationsService } from './auto-notifications-system.service'
export { CommunityNotificationsService } from './auto-notifications-community.service'
export { CourseNotificationsService } from './auto-notifications-courses.service'
export { ContentNotificationsService } from './auto-notifications-content.service'

import { SystemNotificationsService } from './auto-notifications-system.service'
import { CommunityNotificationsService } from './auto-notifications-community.service'
import { CourseNotificationsService } from './auto-notifications-courses.service'
import { ContentNotificationsService } from './auto-notifications-content.service'
import type { NotificationMetadata } from './auto-notifications.shared'

/**
 * Unified facade that mirrors the original AutoNotificationsService API.
 * Delegates every call to the appropriate focused service.
 */
export class AutoNotificationsService {
  // ── System / Auth ──────────────────────────────────────────────────────────

  static notifyPasswordChanged(userId: string, metadata?: NotificationMetadata) {
    return SystemNotificationsService.notifyPasswordChanged(userId, metadata)
  }

  static notifyProfileUpdated(userId: string, changes: string[], metadata?: NotificationMetadata) {
    return SystemNotificationsService.notifyProfileUpdated(userId, changes, metadata)
  }

  static notifyLoginSuccess(userId: string, ip?: string, userAgent?: string, metadata?: NotificationMetadata) {
    return SystemNotificationsService.notifyLoginSuccess(userId, ip, userAgent, metadata)
  }

  static notifyLoginFailed(userId: string, ip?: string, userAgent?: string, metadata?: NotificationMetadata) {
    return SystemNotificationsService.notifyLoginFailed(userId, ip, userAgent, metadata)
  }

  static notifyEmailVerified(userId: string, metadata?: NotificationMetadata) {
    return SystemNotificationsService.notifyEmailVerified(userId, metadata)
  }

  static notifySecurityAlert(userId: string, message: string, metadata?: NotificationMetadata) {
    return SystemNotificationsService.notifySecurityAlert(userId, message, metadata)
  }

  // ── Community ──────────────────────────────────────────────────────────────

  static notifyCommunityPostCreated(
    postId: string,
    communityId: string,
    authorId: string,
    postTitle: string,
    metadata?: NotificationMetadata
  ) {
    return CommunityNotificationsService.notifyCommunityPostCreated(postId, communityId, authorId, postTitle, metadata)
  }

  static notifyCommunityPostComment(
    postId: string,
    commentId: string,
    postAuthorId: string,
    commentAuthorId: string,
    commentPreview: string,
    communityId: string,
    metadata?: NotificationMetadata
  ) {
    return CommunityNotificationsService.notifyCommunityPostComment(
      postId, commentId, postAuthorId, commentAuthorId, commentPreview, communityId, metadata
    )
  }

  static notifyCommunityPostReaction(
    postId: string,
    postAuthorId: string,
    reactionAuthorId: string,
    reactionType: string,
    communityId: string,
    metadata?: NotificationMetadata
  ) {
    return CommunityNotificationsService.notifyCommunityPostReaction(
      postId, postAuthorId, reactionAuthorId, reactionType, communityId, metadata
    )
  }

  static notifyCommunityMemberJoined(
    communityId: string,
    newMemberId: string,
    communityName: string,
    metadata?: NotificationMetadata
  ) {
    return CommunityNotificationsService.notifyCommunityMemberJoined(communityId, newMemberId, communityName, metadata)
  }

  // ── Courses ────────────────────────────────────────────────────────────────

  static notifyCoursePublished(courseId: string, courseTitle: string, metadata?: NotificationMetadata) {
    return CourseNotificationsService.notifyCoursePublished(courseId, courseTitle, metadata)
  }

  static notifyCourseEnrolled(userId: string, courseId: string, courseTitle: string, metadata?: NotificationMetadata) {
    return CourseNotificationsService.notifyCourseEnrolled(userId, courseId, courseTitle, metadata)
  }

  static notifyCourseLessonCompleted(
    userId: string,
    courseId: string,
    courseTitle: string,
    lessonId: string,
    lessonTitle: string,
    metadata?: NotificationMetadata
  ) {
    return CourseNotificationsService.notifyCourseLessonCompleted(
      userId, courseId, courseTitle, lessonId, lessonTitle, metadata
    )
  }

  static notifyCourseCompleted(
    userId: string,
    courseId: string,
    courseTitle: string,
    hasCertificate: boolean = false,
    metadata?: NotificationMetadata
  ) {
    return CourseNotificationsService.notifyCourseCompleted(userId, courseId, courseTitle, hasCertificate, metadata)
  }

  static notifyCourseQuestionAnswered(
    questionId: string,
    questionAuthorId: string,
    answerAuthorId: string,
    courseId: string,
    courseTitle: string,
    answerPreview: string,
    metadata?: NotificationMetadata
  ) {
    return CourseNotificationsService.notifyCourseQuestionAnswered(
      questionId, questionAuthorId, answerAuthorId, courseId, courseTitle, answerPreview, metadata
    )
  }

  // ── Content (news, reels, prompts) ─────────────────────────────────────────

  static notifyNewsPublished(newsId: string, newsTitle: string, metadata?: NotificationMetadata) {
    return ContentNotificationsService.notifyNewsPublished(newsId, newsTitle, metadata)
  }

  static notifyNewsFeatured(newsId: string, newsAuthorId: string, newsTitle: string, metadata?: NotificationMetadata) {
    return ContentNotificationsService.notifyNewsFeatured(newsId, newsAuthorId, newsTitle, metadata)
  }

  static notifyReelCreated(reelId: string, reelTitle: string, authorId: string, metadata?: NotificationMetadata) {
    return ContentNotificationsService.notifyReelCreated(reelId, reelTitle, authorId, metadata)
  }

  static notifyReelLiked(reelId: string, reelAuthorId: string, likeAuthorId: string, metadata?: NotificationMetadata) {
    return ContentNotificationsService.notifyReelLiked(reelId, reelAuthorId, likeAuthorId, metadata)
  }

  static notifyReelComment(
    reelId: string,
    commentId: string,
    reelAuthorId: string,
    commentAuthorId: string,
    commentPreview: string,
    metadata?: NotificationMetadata
  ) {
    return ContentNotificationsService.notifyReelComment(
      reelId, commentId, reelAuthorId, commentAuthorId, commentPreview, metadata
    )
  }

  static notifyPromptCreated(promptId: string, promptTitle: string, authorId: string, metadata?: NotificationMetadata) {
    return ContentNotificationsService.notifyPromptCreated(promptId, promptTitle, authorId, metadata)
  }

  static notifyPromptFavorited(
    promptId: string,
    promptAuthorId: string,
    favoritedByUserId: string,
    promptTitle: string,
    metadata?: NotificationMetadata
  ) {
    return ContentNotificationsService.notifyPromptFavorited(
      promptId, promptAuthorId, favoritedByUserId, promptTitle, metadata
    )
  }
}
