export interface CourseMetadata {
  duration_total_minutes: number
  lesson_count: number
  activity_count: number
  material_count: number
}

export interface ApproachSuggestion {
  approach: 'fast' | 'balanced' | 'long'
  deadline_date: string
  duration_days: number
  duration_weeks: number
  hours_per_week: number
  description: string
  estimated_completion_rate: string
}

export interface DeadlineSuggestionsResult {
  course_id: string
  course_title: string
  metadata: CourseMetadata
  suggestions: ApproachSuggestion[]
  calculated_at: string
}

export type DeadlineApproach = ApproachSuggestion['approach']
