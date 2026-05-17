export interface CourseInstructor {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  username: string | null
}

export interface CourseListItem {
  id: string
  title: string
  description: string | null
  category: string | null
  level: string | null
  instructor_id: string | null
  duration_total_minutes: number | null
  thumbnail_url: string | null
  slug: string
  is_active: boolean
  price: number | null
  average_rating: number | null
  student_count: number | null
  review_count: number | null
  created_at: string
  updated_at: string
  instructor: CourseInstructor | null
}

export interface CourseListResult {
  courses: CourseListItem[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export interface LessonProgress {
  progress_id: string
  lesson_id: string
  user_id: string
  enrollment_id: string
  progress_percent: number
  time_spent_seconds: number
  is_completed: boolean
  last_position: number
  completed_at: string | null
  updated_at: string | null
  last_accessed_at: string | null
  lesson_status: string | null
  video_progress_percentage: number
  quiz_completed: boolean
  quiz_passed: boolean
}

export interface NormalizedCourseListQuery {
  category?: string
  level?: string
  search?: string
  isActive: boolean
  orderBy: 'created_at' | 'title' | 'average_rating' | 'student_count'
  orderDirection: 'asc' | 'desc'
  limit: number
  offset: number
  page: number
}
