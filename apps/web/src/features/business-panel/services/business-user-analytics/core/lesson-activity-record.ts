export interface LessonActivityRecord {
  activity_id: string
  lesson_id: string
  is_required: boolean | null
  estimated_time_minutes: number | null
}
