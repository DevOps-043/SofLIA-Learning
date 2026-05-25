export type GetUserWarningHistoryFunction = {
  Args: { p_user_id: string }
  Returns: {
    content_type: string
    created_at: string
    reason: string
    warning_id: string
    warning_number: number
  }[]
}
