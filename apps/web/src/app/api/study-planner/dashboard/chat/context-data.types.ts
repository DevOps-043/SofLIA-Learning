export interface StudyPlanRow {
  id: string
  name: string
  description: string | null
  start_date: string | null
  end_date: string | null
  timezone: string | null
  preferred_days: number[] | null
}

export interface StudyPlanReference {
  id: string
  name: string
}

export interface StudySessionRow {
  id: string
  title: string
  description: string | null
  start_time: string
  end_time: string
  duration_minutes: number | null
  status: string
  course_id: string | null
  lesson_id: string | null
  external_event_id: string | null
  calendar_provider: string | null
  plan_id: string
  metrics: unknown
}

export interface LessonProgressSummary {
  pct: number
  completed: boolean
}
