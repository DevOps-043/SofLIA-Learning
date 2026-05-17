export type LearningPathItemsTable = {
  Row: {
  course_id: string
  created_at: string
  id: string
  learning_path_id: string
  position: number
  updated_at: string
}
  Insert: {
  course_id: string
  created_at?: string
  id?: string
  learning_path_id: string
  position: number
  updated_at?: string
}
  Update: {
  course_id?: string
  created_at?: string
  id?: string
  learning_path_id?: string
  position?: number
  updated_at?: string
}
  Relationships: [
    { foreignKeyName: "learning_path_items_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "courses"; referencedColumns: ["id"] },
    { foreignKeyName: "learning_path_items_learning_path_id_fkey"; columns: ["learning_path_id"]; isOneToOne: false; referencedRelation: "learning_paths"; referencedColumns: ["id"] },
  ]
}
