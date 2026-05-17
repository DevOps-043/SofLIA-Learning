import { ContentNotificationsService } from '../auto-notifications-content.service'
import type { NotificationMetadata } from '../auto-notifications.shared'

export const contentNotificationFacade = {
  notifyNewsPublished(newsId: string, newsTitle: string, metadata?: NotificationMetadata) {
    return ContentNotificationsService.notifyNewsPublished(newsId, newsTitle, metadata)
  },
  notifyNewsFeatured(
    newsId: string,
    newsAuthorId: string,
    newsTitle: string,
    metadata?: NotificationMetadata,
  ) {
    return ContentNotificationsService.notifyNewsFeatured(newsId, newsAuthorId, newsTitle, metadata)
  },
  notifyReelCreated(
    reelId: string,
    reelTitle: string,
    authorId: string,
    metadata?: NotificationMetadata,
  ) {
    return ContentNotificationsService.notifyReelCreated(reelId, reelTitle, authorId, metadata)
  },
  notifyReelLiked(
    reelId: string,
    reelAuthorId: string,
    likeAuthorId: string,
    metadata?: NotificationMetadata,
  ) {
    return ContentNotificationsService.notifyReelLiked(reelId, reelAuthorId, likeAuthorId, metadata)
  },
  notifyReelComment(
    reelId: string,
    commentId: string,
    reelAuthorId: string,
    commentAuthorId: string,
    commentPreview: string,
    metadata?: NotificationMetadata,
  ) {
    return ContentNotificationsService.notifyReelComment(
      reelId,
      commentId,
      reelAuthorId,
      commentAuthorId,
      commentPreview,
      metadata,
    )
  },
  notifyPromptCreated(promptId: string, promptTitle: string, authorId: string, metadata?: NotificationMetadata) {
    return ContentNotificationsService.notifyPromptCreated(promptId, promptTitle, authorId, metadata)
  },
  notifyPromptFavorited(
    promptId: string,
    promptAuthorId: string,
    favoritedByUserId: string,
    promptTitle: string,
    metadata?: NotificationMetadata,
  ) {
    return ContentNotificationsService.notifyPromptFavorited(
      promptId,
      promptAuthorId,
      favoritedByUserId,
      promptTitle,
      metadata,
    )
  },
}
