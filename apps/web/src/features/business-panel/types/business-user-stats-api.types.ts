import type {
  BusinessUserStatsCourseData,
  CourseWithLessons,
} from './business-user-stats-course.types'
import type { BusinessUserStatsData } from './business-user-stats-summary.types'

export interface BusinessUserStatsApiUser {
  id: string
  username: string
  email: string
  display_name: string
  profile_picture_url: string | null
}

export interface BusinessUserStatsCertificate {
  certificate_id: string
  certificate_url: string | null
  certificate_hash: string | null
  course_id: string
  issued_at: string | null
  expires_at: string | null
  course_title: string
  course_slug: string
  course_thumbnail: string | null
  instructor_name: string
  instructor_username: string | null
}

export interface BusinessUserStatsAssignment {
  assignment_id: string
  course_id: string
  course_title: string
  status: string | null
  completion_percentage: number
  assigned_at: string | null
  due_date: string | null
  completed_at: string | null
}

export interface BusinessUserStatsApiResponse {
  success: true
  user: BusinessUserStatsApiUser
  stats: BusinessUserStatsData
  courses: BusinessUserStatsCourseData[]
  courses_with_lessons: CourseWithLessons[]
  certificates: BusinessUserStatsCertificate[]
  assignments: BusinessUserStatsAssignment[]
}
