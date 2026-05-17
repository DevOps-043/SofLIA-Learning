import type { CourseRelationRecord } from './course-relation-record'
import type { Relation } from './relation'

export interface LiaConversationRecord {
  conversation_id: string
  user_id: string
  course_id: string | null
  context_type: string | null
  conversation_completed: boolean | null
  started_at: string | null
  ended_at: string | null
  created_at: string | null
  updated_at: string | null
  total_messages: number | null
  total_lia_messages: number | null
  total_user_messages: number | null
  courses: Relation<CourseRelationRecord>
}
