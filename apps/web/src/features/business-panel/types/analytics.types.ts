export interface BusinessAnalyticsGeneralMetrics {
  total_users: number
  total_courses_assigned: number
  completed_courses: number
  average_progress: number
  total_time_hours: number
  total_certificates: number
  active_users: number
  retention_rate: number
}

export interface BusinessAnalyticsTrendData {
  date: string
  count: number
}

export interface BusinessAnalyticsRoleDistribution {
  role: string
  count?: number
  average_progress?: number
  total_completed?: number
  average_hours?: number
}

export interface BusinessAnalyticsCourseMetric {
  status: string
  count: number
}

export interface BusinessAnalyticsPlannerStats {
  adherence: number
  total_sessions: number
  completed_sessions: number
  completed: number
  pending: number
}

export interface BusinessAnalyticsActivityCalendarEntry {
  date: string
  count: number
  level: number
}

export interface BusinessAnalyticsCourseBreakdownItem {
  course_id: string
  course_title: string
  progress: number
  status: 'completed' | 'active' | 'enrolled'
}

export interface BusinessAnalyticsCourseStats {
  total_lesson_time_minutes: number
  lessons_started?: number
  lessons_completed: number
  quizzes_completed: number
  quizzes_passed: number
  notes_count: number
  notes_auto_generated?: number
  breakdown: BusinessAnalyticsCourseBreakdownItem[]
}

export interface BusinessAnalyticsLiaContexts {
  ai_chat: number
  course: number
}

export interface BusinessAnalyticsLiaStats {
  total_conversations: number
  total_messages: number
  user_messages: number
  assistant_responses: number
  contexts: BusinessAnalyticsLiaContexts
}

export interface BusinessAnalyticsUserStats {
  current_streak: number
  planner: BusinessAnalyticsPlannerStats
  activity_calendar: BusinessAnalyticsActivityCalendarEntry[]
  hourly_distribution: number[]
  courses: BusinessAnalyticsCourseStats
  lia: BusinessAnalyticsLiaStats
}

export interface BusinessAnalyticsUser {
  user_id: string
  display_name: string
  name: string | null
  first_name: string | null
  last_name: string | null
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
  stats: BusinessAnalyticsUserStats
}

export interface BusinessAnalyticsStickinessPoint {
  name: string
  dau: number
  mau: number
  ratio: number
}

export interface BusinessAnalyticsFrequencyPoint {
  name: string
  users: number
}

export interface BusinessAnalyticsStreakPoint {
  name: string
  value: number
  fill: string
}

export interface BusinessAnalyticsHeatmapPoint {
  day: string
  hour: string
  value: number
}

export interface BusinessAnalyticsDurationPoint {
  role: string
  median: number
  max: number
  count: number
}

export interface BusinessAnalyticsStudyPlannerStatusPoint {
  status: string
  count: number
}

export interface BusinessAnalyticsStudyPlannerUserAdherence {
  user_id: string
  name: string
  email: string
  adherence_rate: number
  total_sessions: number
  completed_sessions: number
}

export interface BusinessAnalyticsStudyPlannerData {
  users_with_plans: number
  total_plans: number
  total_sessions: number
  completed_sessions: number
  missed_sessions: number
  pending_sessions: number
  in_progress_sessions: number
  ai_generated_sessions: number
  sessions_by_status: BusinessAnalyticsStudyPlannerStatusPoint[]
  usage_rate: number
  average_session_duration_minutes: number
  total_study_hours: number
  plan_adherence_rate: number
  on_time_completion_rate: number
  avg_sessions_per_user: number
  user_adherence: BusinessAnalyticsStudyPlannerUserAdherence[]
}

export interface BusinessAnalyticsEngagementMetrics {
  stickiness: BusinessAnalyticsStickinessPoint[]
  frequency: BusinessAnalyticsFrequencyPoint[]
  streaks: BusinessAnalyticsStreakPoint[]
  heatmap: BusinessAnalyticsHeatmapPoint[]
  duration: BusinessAnalyticsDurationPoint[]
}

export interface BusinessAnalyticsTeamStats {
  average_progress: number
  courses_completed: number
  total_enrollments: number
  total_time_hours: number
  lia_conversations: number
}

export interface BusinessAnalyticsTeam {
  team_id: string
  name: string
  description: string | null
  image_url: string | null
  member_count: number
  stats: BusinessAnalyticsTeamStats
}

export interface BusinessAnalyticsTeamsData {
  total_teams: number
  teams: BusinessAnalyticsTeam[]
  ranking: BusinessAnalyticsTeam[]
}

export interface BusinessAnalyticsData {
  general_metrics: BusinessAnalyticsGeneralMetrics
  user_analytics: BusinessAnalyticsUser[]
  trends: {
    enrollments_by_month: BusinessAnalyticsTrendData[]
    completions_by_month: BusinessAnalyticsTrendData[]
    time_by_month: BusinessAnalyticsTrendData[]
    active_users_by_month: BusinessAnalyticsTrendData[]
  }
  by_role: {
    distribution: BusinessAnalyticsRoleDistribution[]
    progress_comparison: BusinessAnalyticsRoleDistribution[]
    completions: BusinessAnalyticsRoleDistribution[]
    time_spent: BusinessAnalyticsRoleDistribution[]
  }
  course_metrics: {
    distribution: BusinessAnalyticsCourseMetric[]
    top_by_time: Array<Record<string, unknown>>
  }
  teams: BusinessAnalyticsTeamsData
  study_planner?: BusinessAnalyticsStudyPlannerData
  engagement_metrics: BusinessAnalyticsEngagementMetrics
}

export interface BusinessAnalyticsApiResponse extends BusinessAnalyticsData {
  success: true
}
