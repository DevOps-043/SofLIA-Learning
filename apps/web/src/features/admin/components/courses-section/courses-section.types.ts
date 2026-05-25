export interface Course {
  id: string
  title: string
  slug: string
  thumbnail_url: string | null
  category: string
  level: string
  instructor_name?: string
  is_active: boolean
  approval_status?: string
}

export interface AssignedCourse {
  id: string
  course_id: string
  assigned_at: string
  status: string
  courses: Course
}

export interface LearningPath {
  id: string
  title: string
  slug: string | null
  description: string | null
  is_active: boolean
  item_count: number
}

export interface OrganizationLearningPathAssignment {
  id: string
  learning_path_id: string
  assigned_at: string
  status: string
  learning_path: LearningPath | null
}

export interface UserAssignment {
  id: string
  user_id: string
  course_id: string
  assigned_at: string
  status: string
  completion_percentage: number
  courses: Course
  users: {
    id: string
    email: string
    display_name: string | null
    first_name: string | null
    last_name: string | null
  }
}

export interface UserLearningPathAssignment {
  id: string
  user_id: string
  learning_path_id: string
  assigned_at: string
  status: string
  learning_path: LearningPath | null
  user: {
    id: string
    email: string
    display_name: string | null
    first_name: string | null
    last_name: string | null
  } | null
}

export interface CompanyMember {
  id: string
  user_id: string
  user: {
    id: string
    email: string
    display_name: string | null
    first_name: string | null
    last_name: string | null
  }
}

export const colors = {
  primary: 'var(--color-primary)',
  accent: 'var(--color-accent)',
  bgPrimary: 'var(--color-gray-950)',
  bgSecondary: 'var(--color-gray-800)',
  bgTertiary: 'var(--color-bg-dark)',
  grayMedium: 'var(--color-muted)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  error: 'var(--color-error)',
  blue: 'var(--color-info)',
  purple: 'var(--color-secondary)',
  pink: 'var(--color-legacy-ec4899)'
}
