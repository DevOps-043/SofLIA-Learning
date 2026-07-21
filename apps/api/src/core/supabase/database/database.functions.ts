export type DatabaseFunctions = {
  get_unread_notification_counts: {
    Args: { p_user_id: string }
    Returns: {
      total: number
      critical: number
      high: number
    }[]
  }
  get_unread_notifications_count: {
    Args: { p_user_id: string }
    Returns: {
      total: number
      critical: number
      high: number
    }[]
  }
  mark_all_notifications_read: {
    Args: { p_user_id: string }
    Returns: {
      updated_count: number
    }[]
  }
}
