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
  primary: '#0A2540',
  accent: '#00D4B3',
  bgPrimary: '#0A0D12',
  bgSecondary: '#1E2329',
  bgTertiary: '#0F1419',
  grayMedium: '#8899A6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  blue: '#3B82F6',
  purple: '#8B5CF6',
  pink: '#EC4899'
}
