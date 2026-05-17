export type LessonTimeEstimatesTable = {
  Row: {
  activities_time_minutes: number | null
  calculated_at: string | null
  exercise_time_minutes: number | null
  id: string
  interactions_time_minutes: number | null
  lesson_id: string
  link_time_minutes: number | null
  quiz_time_minutes: number | null
  reading_time_minutes: number | null
  total_time_minutes: number | null
  updated_at: string | null
  video_duration_seconds: number | null
  video_minutes: number | null
}
  Insert: {
  activities_time_minutes?: number | null
  calculated_at?: string | null
  exercise_time_minutes?: number | null
  id?: string
  interactions_time_minutes?: number | null
  lesson_id: string
  link_time_minutes?: number | null
  quiz_time_minutes?: number | null
  reading_time_minutes?: number | null
  total_time_minutes?: number | null
  updated_at?: string | null
  video_duration_seconds?: number | null
  video_minutes?: number | null
}
  Update: {
  activities_time_minutes?: number | null
  calculated_at?: string | null
  exercise_time_minutes?: number | null
  id?: string
  interactions_time_minutes?: number | null
  lesson_id?: string
  link_time_minutes?: number | null
  quiz_time_minutes?: number | null
  reading_time_minutes?: number | null
  total_time_minutes?: number | null
  updated_at?: string | null
  video_duration_seconds?: number | null
  video_minutes?: number | null
}
  Relationships: [
    { foreignKeyName: "lesson_time_estimates_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: true; referencedRelation: "course_lessons"; referencedColumns: ["lesson_id"] },
    { foreignKeyName: "lesson_time_estimates_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: true; referencedRelation: "v_incomplete_lesson_times"; referencedColumns: ["lesson_id"] },
    { foreignKeyName: "lesson_time_estimates_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: true; referencedRelation: "v_lessons_by_session_type_compatibility"; referencedColumns: ["lesson_id"] },
  ]
}
