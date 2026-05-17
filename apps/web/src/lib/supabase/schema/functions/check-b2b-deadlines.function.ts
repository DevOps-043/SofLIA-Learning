export type CheckB2bDeadlinesFunction = {
  Args: { p_user_id: string; p_weekly_study_minutes: number }
  Returns: {
    can_complete: boolean
    course_id: string
    course_title: string
    due_date: string
    remaining_minutes: number
    weeks_needed: number
  }[]
}
