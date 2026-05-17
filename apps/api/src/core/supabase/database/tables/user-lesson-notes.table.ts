export type UserLessonNotesTable = {
  Row: {
    note_id: string
    user_id: string
  }
  Insert: {
    note_id?: string
    user_id: string
  }
  Update: Record<string, never>
  Relationships: []
}
