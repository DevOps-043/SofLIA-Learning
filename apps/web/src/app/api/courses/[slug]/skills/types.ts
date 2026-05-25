export interface CourseSkillDetails {
  skill_id: string
  name?: string | null
  slug?: string | null
  description?: string | null
  category?: string | null
  icon_url?: string | null
  icon_type?: string | null
  icon_name?: string | null
  color?: string | null
  level?: string | null
}

export interface CourseSkillRow {
  id: string
  is_primary: boolean
  is_required: boolean
  proficiency_level: string | null
  display_order: number
  skills: CourseSkillDetails | null
  user_level?: string | null
  user_course_count?: number
  user_badge_url?: string | null
}

export interface UserSkillLevelRow {
  level?: string | null
  course_count?: number | null
}

export interface CourseSkillInput {
  skill_id: string
  is_primary?: boolean
  is_required?: boolean
  proficiency_level?: string
  display_order?: number
}

export interface CourseLookup {
  id: string
  instructor_id: string | null
}
