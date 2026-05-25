export type ValidateSessionTimesFunction = {
  Args: { p_plan_id: string }
  Returns: {
    error_message: string
    is_valid: boolean
    min_lesson_time: number
    plan_min_session: number
  }[]
}
