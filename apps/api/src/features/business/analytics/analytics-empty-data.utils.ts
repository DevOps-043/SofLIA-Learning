import type {
  AnalyticsSourceData,
  BusinessAnalyticsData,
} from './analytics.types'

export function getEmptyBusinessAnalyticsData(
  organization: AnalyticsSourceData['organization'],
): BusinessAnalyticsData {
  return {
    organization,
    general_metrics: {
      total_users: 0,
      total_courses_assigned: 0,
      completed_courses: 0,
      average_progress: 0,
      total_time_hours: 0,
      total_certificates: 0,
      active_users: 0,
      retention_rate: 0,
    },
    user_analytics: [],
    trends: {
      enrollments_by_month: [],
      completions_by_month: [],
      time_by_month: [],
      active_users_by_month: [],
    },
    by_role: {
      distribution: [],
      progress_comparison: [],
      completions: [],
      time_spent: [],
    },
    course_metrics: { distribution: [] },
    engagement_metrics: {
      stickiness: [],
      frequency: [],
      streaks: [],
      heatmap: [],
      duration: [],
    },
    teams: { total_teams: 0, teams: [], ranking: [] },
  }
}
