export type UserLearningPathProgressTable = {
  Row: {
  completed_at: string | null
  completed_items_count: number
  created_at: string
  current_course_id: string | null
  id: string
  last_unlocked_at: string | null
  learning_path_id: string
  lp_intro_watched_at: string | null
  next_course_id: string | null
  organization_id: string | null
  progress_percentage: number
  status: string
  total_items_count: number
  updated_at: string
  user_id: string
}
  Insert: {
  completed_at?: string | null
  completed_items_count?: number
  created_at?: string
  current_course_id?: string | null
  id?: string
  last_unlocked_at?: string | null
  learning_path_id: string
  lp_intro_watched_at?: string | null
  next_course_id?: string | null
  organization_id?: string | null
  progress_percentage?: number
  status?: string
  total_items_count?: number
  updated_at?: string
  user_id: string
}
  Update: {
  completed_at?: string | null
  completed_items_count?: number
  created_at?: string
  current_course_id?: string | null
  id?: string
  last_unlocked_at?: string | null
  learning_path_id?: string
  lp_intro_watched_at?: string | null
  next_course_id?: string | null
  organization_id?: string | null
  progress_percentage?: number
  status?: string
  total_items_count?: number
  updated_at?: string
  user_id?: string
}
  Relationships: [
    { foreignKeyName: "user_learning_path_progress_current_course_id_fkey"; columns: ["current_course_id"]; isOneToOne: false; referencedRelation: "courses"; referencedColumns: ["id"] },
    { foreignKeyName: "user_learning_path_progress_learning_path_id_fkey"; columns: ["learning_path_id"]; isOneToOne: false; referencedRelation: "learning_paths"; referencedColumns: ["id"] },
    { foreignKeyName: "user_learning_path_progress_next_course_id_fkey"; columns: ["next_course_id"]; isOneToOne: false; referencedRelation: "courses"; referencedColumns: ["id"] },
    { foreignKeyName: "user_learning_path_progress_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
    { foreignKeyName: "user_learning_path_progress_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
  ]
}
