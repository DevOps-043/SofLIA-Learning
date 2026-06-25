import type { Json } from '../json'

export type DeleteNotificationFunction = {
  Args: {
    p_notification_id: string
    p_user_id?: string
  }
  Returns: Json
}
