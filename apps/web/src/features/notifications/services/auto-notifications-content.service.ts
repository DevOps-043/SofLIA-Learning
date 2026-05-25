import {
  notifyNewsFeatured,
  notifyNewsPublished,
} from './content-notifications/news-notifications.service'
import { notifyPromptCreated } from './content-notifications/prompt-created-notifications.service'
import { notifyPromptFavorited } from './content-notifications/prompt-favorited-notifications.service'
import { notifyReelComment } from './content-notifications/reel-comment-notifications.service'
import { notifyReelCreated } from './content-notifications/reel-created-notifications.service'
import { notifyReelLiked } from './content-notifications/reel-like-notifications.service'

export class ContentNotificationsService {
  static notifyNewsPublished = notifyNewsPublished
  static notifyNewsFeatured = notifyNewsFeatured
  static notifyReelCreated = notifyReelCreated
  static notifyReelLiked = notifyReelLiked
  static notifyReelComment = notifyReelComment
  static notifyPromptCreated = notifyPromptCreated
  static notifyPromptFavorited = notifyPromptFavorited
}
