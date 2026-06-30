export type BusinessCourseDetailTabId = 'info' | 'content' | 'reviews' | 'instructor'

export interface BusinessCourseInstructor {
  id: string
  name: string
  email: string
  profile_picture_url: string | null
  bio: string | null
  linkedin_url: string | null
  github_url: string | null
  website_url: string | null
  location: string | null
  cargo_rol: string | null
  type_rol: string | null
}

export interface BusinessCourseReview {
  id: string
  title: string | null
  content: string
  rating: number
  is_verified: boolean
  created_at: string
  user: {
    name: string
    profile_picture_url: string | null
  }
}

export interface BusinessCourseLesson {
  lesson_id: string
  lesson_title: string
  lesson_description: string | null
  lesson_order_index: number
  duration_seconds: number
  total_duration_minutes?: number | null
  video_provider: string
  video_provider_id: string
  instructor_id?: string | null
}

export interface BusinessCourseModule {
  module_id: string
  module_title: string
  module_description: string | null
  module_order_index: number
  module_duration_minutes: number | null
  calculated_duration_minutes: number
  is_required: boolean
  lessons: BusinessCourseLesson[]
}

export interface BusinessCourseSubscriptionStatus {
  has_subscription: boolean
  is_purchased: boolean
  is_organization_purchased: boolean
  can_assign: boolean
  can_purchase_for_free?: boolean
  monthly_course_count?: number
  max_courses_per_period?: number
}

export interface BusinessCourseDetail {
  id: string
  title: string
  description: string | null
  category: string | null
  level: string | null
  instructor: BusinessCourseInstructor | null
  duration: number | null
  thumbnail_url: string | null
  slug: string | null
  price: number | null
  rating: number
  student_count: number
  review_count: number
  learning_objectives: string[]
  created_at: string
  updated_at: string
  stats: {
    total_modules: number
    total_lessons: number
    total_duration_minutes: number
  }
  modules: BusinessCourseModule[]
  reviews: BusinessCourseReview[]
  subscription_status?: BusinessCourseSubscriptionStatus
}

export interface BusinessCourseLevelStyles {
  bg: string
  color: string
  text: string
}
