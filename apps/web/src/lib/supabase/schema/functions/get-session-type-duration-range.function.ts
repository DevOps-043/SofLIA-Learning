export type GetSessionTypeDurationRangeFunction = {
  Args: { p_session_type: string }
  Returns: {
    max_duration_minutes: number
    min_duration_minutes: number
    session_type: string
  }[]
}
