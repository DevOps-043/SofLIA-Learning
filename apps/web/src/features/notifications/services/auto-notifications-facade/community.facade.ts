import { CommunityNotificationsService } from '../auto-notifications-community.service'
import type { NotificationMetadata } from '../auto-notifications.shared'

export const communityNotificationFacade = {
  notifyCommunityPostCreated(
    postId: string,
    communityId: string,
    authorId: string,
    postTitle: string,
    metadata?: NotificationMetadata,
  ) {
    return CommunityNotificationsService.notifyCommunityPostCreated(
      postId,
      communityId,
      authorId,
      postTitle,
      metadata,
    )
  },
  notifyCommunityPostComment(
    postId: string,
    commentId: string,
    postAuthorId: string,
    commentAuthorId: string,
    commentPreview: string,
    communityId: string,
    metadata?: NotificationMetadata,
  ) {
    return CommunityNotificationsService.notifyCommunityPostComment(
      postId,
      commentId,
      postAuthorId,
      commentAuthorId,
      commentPreview,
      communityId,
      metadata,
    )
  },
  notifyCommunityPostReaction(
    postId: string,
    postAuthorId: string,
    reactionAuthorId: string,
    reactionType: string,
    communityId: string,
    metadata?: NotificationMetadata,
  ) {
    return CommunityNotificationsService.notifyCommunityPostReaction(
      postId,
      postAuthorId,
      reactionAuthorId,
      reactionType,
      communityId,
      metadata,
    )
  },
  notifyCommunityMemberJoined(
    communityId: string,
    newMemberId: string,
    communityName: string,
    metadata?: NotificationMetadata,
  ) {
    return CommunityNotificationsService.notifyCommunityMemberJoined(
      communityId,
      newMemberId,
      communityName,
      metadata,
    )
  },
}
