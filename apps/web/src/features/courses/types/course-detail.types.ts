export type CourseDetailTabId = 'info' | 'content' | 'instructor'

export interface CourseDetailCourse {
  id: string
  title: string
  description?: string | null
  thumbnail?: string | null
  status?: string
  estimatedDuration?: number
  difficulty?: string
  isPublic?: boolean
  createdAt?: Date
  updatedAt: string | Date
  instructor_name?: string
  instructor_email?: string
  category?: string
  slug?: string
  rating?: number
  price?: string
  isFavorite?: boolean
  student_count?: number
  review_count?: number
  learning_objectives?: string[]
  instructor_id?: string
}

export interface CourseDetailLesson {
  lesson_id: string
  lesson_title: string
  lesson_description?: string | null
  lesson_order_index: number
  duration_seconds: number
  total_duration_minutes?: number | null
  video_provider_id?: string | null
  video_provider?: string | null
  is_completed?: boolean
  progress_percentage?: number
}

export interface CourseDetailModule {
  module_id: string
  module_title: string
  module_description?: string | null
  module_order_index: number
  module_duration_minutes?: number | null
  is_published?: boolean
  lessons: CourseDetailLesson[]
}

export interface CourseDetailSkill {
  id: string
  skill_id?: string
  name: string
  slug?: string
  description?: string
  category?: string
  icon_url?: string | null
  icon_type?: string | null
  icon_name?: string | null
  color?: string | null
  level?: string | null
  is_primary?: boolean
  is_required?: boolean
  proficiency_level?: string | null
  display_order?: number
}

export interface CourseInstructorProfile {
  id: string
  first_name?: string | null
  last_name?: string | null
  display_name?: string | null
  username?: string | null
  email?: string | null
  profile_picture_url?: string | null
  bio?: string | null
  cargo_rol?: string | null
  location?: string | null
}

export interface CourseDetailResponse {
  course: CourseDetailCourse
  isPurchased: boolean
  modules: CourseDetailModule[]
  overall_progress_percentage: number
  skills: CourseDetailSkill[]
  instructor: CourseInstructorProfile | null
}

export interface CourseDetailSummary {
  totalModules: number
  totalLessons: number
  totalDurationMinutes: number
}
