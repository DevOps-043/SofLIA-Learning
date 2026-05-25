import type { Json } from '../json'

export type GetUserSkillsFunction = {
  Args: { p_user_id: string }
  Returns: {
    color: string
    course_count: number
    courses: Json
    icon_name: string
    icon_type: string
    icon_url: string
    obtained_at: string
    proficiency_level: string
    skill_category: string
    skill_description: string
    skill_id: string
    skill_name: string
    skill_slug: string
  }[]
}
