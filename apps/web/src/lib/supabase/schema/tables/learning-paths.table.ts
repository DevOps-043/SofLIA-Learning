export type LearningPathsTable = {
  Row: {
  created_at: string
  created_by: string | null
  description: string | null
  id: string
  is_active: boolean
  slug: string | null
  title: string
  updated_at: string
}
  Insert: {
  created_at?: string
  created_by?: string | null
  description?: string | null
  id?: string
  is_active?: boolean
  slug?: string | null
  title: string
  updated_at?: string
}
  Update: {
  created_at?: string
  created_by?: string | null
  description?: string | null
  id?: string
  is_active?: boolean
  slug?: string | null
  title?: string
  updated_at?: string
}
  Relationships: [
    { foreignKeyName: "learning_paths_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
  ]
}
