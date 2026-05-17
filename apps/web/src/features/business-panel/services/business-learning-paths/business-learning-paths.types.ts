export interface BusinessLearningPathCourseSummary {
  id: string
  title: string
  slug: string | null
  thumbnail_url: string | null
  category: string | null
  level: string | null
}

export interface BusinessLearningPathItem {
  id: string
  learning_path_id: string
  course_id: string
  position: number
  course: BusinessLearningPathCourseSummary | null
}

export interface BusinessLearningPath {
  id: string
  title: string
  slug: string | null
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  items: BusinessLearningPathItem[]
  item_count: number
}

export interface BusinessLearningPathAssignment {
  id: string
  organization_id: string
  user_id: string
  learning_path_id: string
  assigned_at: string
  status: 'assigned' | 'revoked'
  assignment_source?: 'manual' | 'bulk' | 'default_rule'
  default_rule_id?: string | null
  learning_path: BusinessLearningPath | null
  user: BusinessLearningPathUser | null
}

export interface BusinessLearningPathUser {
  id: string
  email: string
  display_name: string | null
  first_name: string | null
  last_name: string | null
}
