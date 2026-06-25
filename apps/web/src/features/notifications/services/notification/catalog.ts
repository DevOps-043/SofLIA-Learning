export const NOTIFICATION_CHANNELS = [
  'in_app',
  'email',
  'push',
  'sms',
  'whatsapp',
] as const

export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number]

export const EXTERNAL_NOTIFICATION_CHANNELS = [
  'email',
  'push',
  'sms',
  'whatsapp',
] as const

export type ExternalNotificationChannel =
  (typeof EXTERNAL_NOTIFICATION_CHANNELS)[number]

export const NOTIFICATION_EVENTS = [
  'system_password_changed',
  'system_profile_updated',
  'system_login_success',
  'system_login_unusual',
  'system_login_failed',
  'system_email_verified',
  'system_security_alert',
  'questionnaire_required',
  'community_post_created',
  'community_post_comment',
  'community_post_reaction',
  'community_member_joined',
  'course_published',
  'course_enrolled',
  'course_activity_completed',
  'course_completed',
  'course_lesson_completed',
  'course_question_answered',
  'certificate_generated',
  'learning_daily_summary',
  'news_published',
  'news_featured',
  'reel_created',
  'reel_liked',
  'reel_comment',
  'prompt_created',
  'prompt_favorited',
  'org_invitation_received',
  'org_role_updated',
  'org_team_assigned',
  'team_assignment',
  'learning_path_assigned',
  'course_deadline_approaching',
  'mandatory_course_reminder',
  'hierarchy_chat_message',
  'planner_rebalance_suggested',
  'study_session_overdue',
] as const

export type NotificationEventType = (typeof NOTIFICATION_EVENTS)[number]

export const NOTIFICATION_EVENT_CHANNEL_DEFAULTS: Partial<
  Record<NotificationEventType, NotificationChannel[]>
> = {
  certificate_generated: ['in_app', 'whatsapp'],
  course_completed: ['in_app'],
  learning_daily_summary: ['in_app', 'whatsapp'],
  system_login_failed: ['in_app'],
  system_login_unusual: ['in_app'],
  system_security_alert: ['in_app', 'whatsapp'],
}

export function isNotificationChannel(
  value: unknown,
): value is NotificationChannel {
  return (
    typeof value === 'string' &&
    NOTIFICATION_CHANNELS.includes(value as NotificationChannel)
  )
}

export function normalizeNotificationChannels(
  channels: readonly unknown[] | undefined,
): NotificationChannel[] {
  const normalized = (channels || []).filter(isNotificationChannel)
  const uniqueChannels = [...new Set(normalized)]

  return uniqueChannels.includes('in_app')
    ? uniqueChannels
    : ['in_app', ...uniqueChannels]
}

export function getDefaultNotificationChannels(
  notificationType: string,
): NotificationChannel[] {
  const defaults =
    NOTIFICATION_EVENT_CHANNEL_DEFAULTS[
      notificationType as NotificationEventType
    ]

  return normalizeNotificationChannels(defaults)
}
