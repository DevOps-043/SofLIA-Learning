export type LiaLiveTranscriptEntriesTable = {
  Row: {
    content: string
    created_at: string
    entry_id: string
    role: string
    sequence: number
    session_id: string
  }
  Insert: {
    content: string
    created_at?: string
    entry_id?: string
    role: string
    sequence: number
    session_id: string
  }
  Update: {
    content?: string
    created_at?: string
    entry_id?: string
    role?: string
    sequence?: number
    session_id?: string
  }
  Relationships: [
    { foreignKeyName: "lia_live_transcript_entries_session_id_fkey"; columns: ["session_id"]; isOneToOne: false; referencedRelation: "lia_live_sessions"; referencedColumns: ["session_id"] },
  ]
}
