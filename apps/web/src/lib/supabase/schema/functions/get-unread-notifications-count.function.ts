export type GetUnreadNotificationsCountFunction = {
  Args: { p_user_id: string }
  Returns: {
    critical: number
    high: number
    total: number
  }[]
}
