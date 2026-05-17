export type UserLearningPathAssignmentsTable = {
  Row: {
  assigned_at: string
  assigned_by: string | null
  created_at: string
  id: string
  learning_path_id: string
  organization_id: string
  status: string
  updated_at: string
  user_id: string
}
  Insert: {
  assigned_at?: string
  assigned_by?: string | null
  created_at?: string
  id?: string
  learning_path_id: string
  organization_id: string
  status?: string
  updated_at?: string
  user_id: string
}
  Update: {
  assigned_at?: string
  assigned_by?: string | null
  created_at?: string
  id?: string
  learning_path_id?: string
  organization_id?: string
  status?: string
  updated_at?: string
  user_id?: string
}
  Relationships: [
    { foreignKeyName: "user_learning_path_assignments_assigned_by_fkey"; columns: ["assigned_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "user_learning_path_assignments_learning_path_id_fkey"; columns: ["learning_path_id"]; isOneToOne: false; referencedRelation: "learning_paths"; referencedColumns: ["id"] },
    { foreignKeyName: "user_learning_path_assignments_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
    { foreignKeyName: "user_learning_path_assignments_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
  ]
}
