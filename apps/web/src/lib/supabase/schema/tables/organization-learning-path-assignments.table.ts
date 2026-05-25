export type OrganizationLearningPathAssignmentsTable = {
  Row: {
  assigned_at: string
  assigned_by: string | null
  created_at: string
  id: string
  intro_video_url: string | null
  learning_path_id: string
  organization_id: string
  status: string
  updated_at: string
}
  Insert: {
  assigned_at?: string
  assigned_by?: string | null
  created_at?: string
  id?: string
  intro_video_url?: string | null
  learning_path_id: string
  organization_id: string
  status?: string
  updated_at?: string
}
  Update: {
  assigned_at?: string
  assigned_by?: string | null
  created_at?: string
  id?: string
  intro_video_url?: string | null
  learning_path_id?: string
  organization_id?: string
  status?: string
  updated_at?: string
}
  Relationships: [
    { foreignKeyName: "organization_learning_path_assignments_assigned_by_fkey"; columns: ["assigned_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "organization_learning_path_assignments_learning_path_id_fkey"; columns: ["learning_path_id"]; isOneToOne: false; referencedRelation: "learning_paths"; referencedColumns: ["id"] },
    { foreignKeyName: "organization_learning_path_assignments_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
  ]
}
