import type {
  BusinessUserStatsCompletedByMonthPoint,
  BusinessUserStatsCourseData,
  BusinessUserStatsDistribution,
  BusinessUserStatsTimeByCoursePoint,
  CourseWithLessons,
} from './business-user-stats-course.types'

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
  courses_with_lessons: CourseWithLessons[]
  time_by_course: BusinessUserStatsTimeByCoursePoint[]
  completed_by_month: BusinessUserStatsCompletedByMonthPoint[]
  distribution: BusinessUserStatsDistribution
}
