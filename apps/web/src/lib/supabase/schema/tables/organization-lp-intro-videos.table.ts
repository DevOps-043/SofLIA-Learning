export type OrganizationLpIntroVideosTable = {
  Row: {
  id: string
  organization_id: string
  learning_path_id: string
  intro_video_url: string
  created_at: string
  updated_at: string
}
  Insert: {
  id?: string
  organization_id: string
  learning_path_id: string
  intro_video_url: string
  created_at?: string
  updated_at?: string
}
  Update: {
  id?: string
  organization_id?: string
  learning_path_id?: string
  intro_video_url?: string
  created_at?: string
  updated_at?: string
}
  Relationships: [
    { foreignKeyName: "organization_lp_intro_videos_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
    { foreignKeyName: "organization_lp_intro_videos_learning_path_id_fkey"; columns: ["learning_path_id"]; isOneToOne: false; referencedRelation: "learning_paths"; referencedColumns: ["id"] },
  ]
}
