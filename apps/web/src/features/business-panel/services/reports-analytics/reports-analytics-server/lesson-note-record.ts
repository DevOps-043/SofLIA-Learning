import type { CourseLessonRelationRecord } from './course-lesson-relation-record'
import type { Relation } from './relation'

export interface LessonNoteRecord {
  note_id: string
  user_id: string
  lesson_id: string | null
  note_title?: string | null
  note_content?: string | null
  is_auto_generated: boolean | null
  source_type: string | null
  created_at: string | null
  updated_at: string | null
  course_lessons: Relation<CourseLessonRelationRecord>
}
