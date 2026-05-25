export interface CourseAnalyticsTabProps {
  courseId: string;
  orgSlug: string;
  refreshKey?: number;
}

export interface CourseAnalyticsStats {
  average_progress: number;
  average_time_minutes: number;
  completed: number;
  completion_rate: number;
  total_assigned: number;
}

export interface CourseAnalyticsEngagement {
  active_learners: number;
  average_session_duration: number;
  retention_rate: number;
  total_sessions: number;
}

export interface CourseAnalyticsPerformance {
  average_completion_time_days: number;
  average_rating: number;
  total_reviews: number;
}

export interface ProgressDistributionItem {
  count: number;
  range: string;
}

export interface DropoffPoint {
  dropoff_count: number;
  lesson_title: string;
}

export interface DropoffAnalysis {
  average_dropoff_percentage: number;
  dropoff_points: DropoffPoint[];
}

export interface CourseAnalyticsResponse {
  dropoff_analysis: DropoffAnalysis;
  engagement: CourseAnalyticsEngagement;
  error?: string;
  performance: CourseAnalyticsPerformance;
  progress_distribution: ProgressDistributionItem[];
  stats: CourseAnalyticsStats;
  success?: boolean;
}
