import type { ArchiveNotificationFunction } from './archive-notification.function'
import type { DeleteNotificationFunction } from './delete-notification.function'
import type { MarkAllNotificationsReadFunction } from './mark-all-notifications-read.function'
import type { MarkNotificationReadFunction } from './mark-notification-read.function'
import type { ValidateLessonFitsSessionTypeFunction } from './validate-lesson-fits-session-type.function'
import type { ValidateSessionTimesFunction } from './validate-session-times.function'

export type PublicFunctionsGroup04 = {
  archive_notification: ArchiveNotificationFunction
  delete_notification: DeleteNotificationFunction
  mark_all_notifications_read: MarkAllNotificationsReadFunction
  mark_notification_read: MarkNotificationReadFunction
  validate_lesson_fits_session_type: ValidateLessonFitsSessionTypeFunction
  validate_session_times: ValidateSessionTimesFunction
}
