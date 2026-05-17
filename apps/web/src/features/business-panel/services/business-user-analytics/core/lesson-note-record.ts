export interface LessonNoteRecord {
  note_id: string
  lesson_id: string
  organization_id: string | null
  note_title: string
  note_content: string
  is_auto_generated: boolean | null
  source_type: string | null
  created_at: string | null
  updated_at: string | null
}
