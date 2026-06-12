export interface LessonTrackingRecord {
  id: string
  enrollment_id: string | null
  lesson_id: string
  organization_id: string | null
  status: string
  started_at: string | null
  completed_at: string | null
  last_activity_at: string | null
  t_lesson_minutes: number | null
  t_video_minutes: number | null
  t_materials_minutes: number | null
  updated_at: string
}
