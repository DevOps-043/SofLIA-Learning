export type GetUserSkillLevelFunction = {
  Args: { p_skill_id: string; p_user_id: string }
  Returns: {
    course_count: number
    level: string
    next_level_courses_needed: number
  }[]
}
