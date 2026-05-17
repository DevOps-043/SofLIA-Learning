export interface AnalyticsUserPlannerStats {
  adherence: number
  total_sessions: number
  completed_sessions: number
  pending_sessions: number
}

export interface AnalyticsUserCourseStats {
  total_lesson_time_minutes: number
  lessons_completed: number
  quizzes_completed: number
  quizzes_passed: number
}

export interface AnalyticsUserStats {
  current_streak: number
  planner: AnalyticsUserPlannerStats
  courses: AnalyticsUserCourseStats
}

export interface AnalyticsUser {
  user_id: string
  display_name: string
  email: string
  username: string
  role: string
  profile_picture_url: string | null
  courses_assigned: number
  courses_completed: number
  average_progress: number
  total_time_hours: number
  total_time_minutes: number
  certificates_count: number
  last_login_at: string | null
  last_active: string | null
  joined_at: string | null
  stats: AnalyticsUserStats
}
