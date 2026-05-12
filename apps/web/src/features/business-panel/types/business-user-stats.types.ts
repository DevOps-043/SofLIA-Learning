export type BusinessUserStatsTabId = 'overview' | 'courses' | 'progress' | 'activity'

export interface BusinessUserStatsCourseData {
  course_id: string
  course_title: string
  progress: number
  status: string
  assignment_status?: string | null
  enrolled_at: string | null
  assigned_at?: string | null
  due_date?: string | null
  completed_at: string | null
  is_assigned?: boolean
  has_certificate: boolean
  lia_conversations_count?: number
  lia_messages_count?: number
  lia_avg_duration_minutes?: number
  lia_last_conversation?: string | null
  quiz_total?: number
  quiz_passed?: number
  quiz_failed?: number
  quiz_average_score?: number
  quiz_best_score?: number
  quiz_total_attempts?: number
  lia_activities_completed?: number
  notes_count?: number
  time_spent_minutes?: number
  modules_total?: number
  modules_completed?: number
  lessons_total?: number
  lessons_completed?: number
  lessons_in_progress?: number
  activities_completed?: number
  activities_total?: number
  readings_viewed?: number
  quiz_lessons_completed?: number
}

export interface BusinessUserStatsTimeByCoursePoint {
  course_id: string
  course_title: string
  total_minutes: number
  total_hours: number
}

export interface BusinessUserStatsCompletedByMonthPoint {
  month: string
  count: number
}

export interface BusinessUserStatsDistribution {
  completed: number
  in_progress: number
  not_started: number
}

export interface BusinessUserStatsData {
  total_courses: number
  completed_courses: number
  in_progress_courses: number
  not_started_courses: number
  average_progress: number
  total_time_spent_minutes: number
  total_time_spent_hours: number
  completed_lessons: number
  total_lessons: number
  certificates_count: number
  notes_count: number
  total_assignments: number
  completed_assignments: number
  lia_conversations_total?: number
  lia_messages_total?: number
  quiz_total?: number
  quiz_passed?: number
  quiz_failed?: number
  quiz_average_score?: number
  lia_activities_completed?: number
  lia_activities_total?: number
  courses_data: BusinessUserStatsCourseData[]
  time_by_course: BusinessUserStatsTimeByCoursePoint[]
  completed_by_month: BusinessUserStatsCompletedByMonthPoint[]
  distribution: BusinessUserStatsDistribution
}

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
  certificates: BusinessUserStatsCertificate[]
  assignments: BusinessUserStatsAssignment[]
}
