export type BusinessUserStatsTabId = 'overview' | 'courses' | 'progress' | 'activity' | 'lessons'

export interface LessonDetail {
  lesson_id: string
  lesson_title: string | null
  lesson_order: number | null
  module_id: string | null
  module_title: string | null
  module_order: number | null
  status: 'not_started' | 'in_progress' | 'completed'
  video_progress_pct: number
  video_watched: boolean
  activities_completed: number
  activities_total: number
  activity_done: boolean
  quiz_completed: boolean
  quiz_passed: boolean | null
  quiz_score: number | null
  lia_conversations: number
  lia_messages: number
  notes_count: number
  time_spent_minutes: number
}

export interface CourseWithLessons {
  course_id: string
  course_title: string | null
  lessons: LessonDetail[]
}

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
