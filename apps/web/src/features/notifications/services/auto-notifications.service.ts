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

/**
 * Unified facade that mirrors the original AutoNotificationsService API.
 * Delegates every call to the appropriate focused service.
 */
export class AutoNotificationsService {
  // ── System / Auth ──────────────────────────────────────────────────────────

  static notifyPasswordChanged(userId: string, metadata?: Record<string, any>) {
    return SystemNotificationsService.notifyPasswordChanged(userId, metadata)
  }

  static notifyProfileUpdated(userId: string, changes: string[], metadata?: Record<string, any>) {
    return SystemNotificationsService.notifyProfileUpdated(userId, changes, metadata)
  }

  static notifyLoginSuccess(userId: string, ip?: string, userAgent?: string, metadata?: Record<string, any>) {
    return SystemNotificationsService.notifyLoginSuccess(userId, ip, userAgent, metadata)
  }

  static notifyLoginFailed(userId: string, ip?: string, userAgent?: string, metadata?: Record<string, any>) {
    return SystemNotificationsService.notifyLoginFailed(userId, ip, userAgent, metadata)
  }

  static notifyEmailVerified(userId: string, metadata?: Record<string, any>) {
    return SystemNotificationsService.notifyEmailVerified(userId, metadata)
  }

  static notifySecurityAlert(userId: string, message: string, metadata?: Record<string, any>) {
    return SystemNotificationsService.notifySecurityAlert(userId, message, metadata)
  }

  // ── Community ──────────────────────────────────────────────────────────────

  static notifyCommunityPostCreated(
    postId: string,
    communityId: string,
    authorId: string,
    postTitle: string,
    metadata?: Record<string, any>
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
    metadata?: Record<string, any>
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
    metadata?: Record<string, any>
  ) {
    return CommunityNotificationsService.notifyCommunityPostReaction(
      postId, postAuthorId, reactionAuthorId, reactionType, communityId, metadata
    )
  }

  static notifyCommunityMemberJoined(
    communityId: string,
    newMemberId: string,
    communityName: string,
    metadata?: Record<string, any>
  ) {
    return CommunityNotificationsService.notifyCommunityMemberJoined(communityId, newMemberId, communityName, metadata)
  }

  // ── Courses ────────────────────────────────────────────────────────────────

  static notifyCoursePublished(courseId: string, courseTitle: string, metadata?: Record<string, any>) {
    return CourseNotificationsService.notifyCoursePublished(courseId, courseTitle, metadata)
  }

  static notifyCourseEnrolled(userId: string, courseId: string, courseTitle: string, metadata?: Record<string, any>) {
    return CourseNotificationsService.notifyCourseEnrolled(userId, courseId, courseTitle, metadata)
  }

  static notifyCourseLessonCompleted(
    userId: string,
    courseId: string,
    courseTitle: string,
    lessonId: string,
    lessonTitle: string,
    metadata?: Record<string, any>
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
    metadata?: Record<string, any>
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
    metadata?: Record<string, any>
  ) {
    return CourseNotificationsService.notifyCourseQuestionAnswered(
      questionId, questionAuthorId, answerAuthorId, courseId, courseTitle, answerPreview, metadata
    )
  }

  // ── Content (news, reels, prompts) ─────────────────────────────────────────

  static notifyNewsPublished(newsId: string, newsTitle: string, metadata?: Record<string, any>) {
    return ContentNotificationsService.notifyNewsPublished(newsId, newsTitle, metadata)
  }

  static notifyNewsFeatured(newsId: string, newsAuthorId: string, newsTitle: string, metadata?: Record<string, any>) {
    return ContentNotificationsService.notifyNewsFeatured(newsId, newsAuthorId, newsTitle, metadata)
  }

  static notifyReelCreated(reelId: string, reelTitle: string, authorId: string, metadata?: Record<string, any>) {
    return ContentNotificationsService.notifyReelCreated(reelId, reelTitle, authorId, metadata)
  }

  static notifyReelLiked(reelId: string, reelAuthorId: string, likeAuthorId: string, metadata?: Record<string, any>) {
    return ContentNotificationsService.notifyReelLiked(reelId, reelAuthorId, likeAuthorId, metadata)
  }

  static notifyReelComment(
    reelId: string,
    commentId: string,
    reelAuthorId: string,
    commentAuthorId: string,
    commentPreview: string,
    metadata?: Record<string, any>
  ) {
    return ContentNotificationsService.notifyReelComment(
      reelId, commentId, reelAuthorId, commentAuthorId, commentPreview, metadata
    )
  }

  static notifyPromptCreated(promptId: string, promptTitle: string, authorId: string, metadata?: Record<string, any>) {
    return ContentNotificationsService.notifyPromptCreated(promptId, promptTitle, authorId, metadata)
  }

  static notifyPromptFavorited(
    promptId: string,
    promptAuthorId: string,
    favoritedByUserId: string,
    promptTitle: string,
    metadata?: Record<string, any>
  ) {
    return ContentNotificationsService.notifyPromptFavorited(
      promptId, promptAuthorId, favoritedByUserId, promptTitle, metadata
    )
  }
}
