import type { CourseRelationRecord } from './course-relation-record'
import type { LessonActivityRelationRecord } from './lesson-activity-relation-record'
import type { Relation } from './relation'

export interface ActivitySubmissionRecord {
  submission_id: string
  user_id: string
  organization_id: string | null
  course_id: string
  lesson_id: string
  activity_id: string
  enrollment_id: string
  status: string | null
  response_text?: string | null
  response_payload?: unknown
  evidence_payload?: unknown
  submitted_at: string | null
  last_validated_at: string | null
  created_at: string | null
  updated_at: string | null
  courses: Relation<CourseRelationRecord>
  lesson_activities: Relation<LessonActivityRelationRecord>
}
