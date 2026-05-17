import type { LessonActivityRelationRecord } from './lesson-activity-relation-record'
import type { Relation } from './relation'

export interface ActivityCompletionRecord {
  completion_id: string
  user_id: string
  activity_id: string
  status: string | null
  completed_steps: number | null
  total_steps: number | null
  time_to_complete_seconds: number | null
  attempts_to_complete: number | null
  user_needed_help: boolean | null
  lia_had_to_redirect: number | null
  generated_output?: unknown
  completed_at: string | null
  started_at: string | null
  updated_at: string | null
  lesson_activities: Relation<LessonActivityRelationRecord>
}
