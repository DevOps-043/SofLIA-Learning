import type { Json } from '../json'

export type ScormPackagesTable = {
  Row: {
  course_id: string | null
  created_at: string | null
  created_by: string | null
  description: string | null
  entry_point: string
  file_size: number | null
  id: string
  manifest_data: Json
  organization_id: string | null
  status: string | null
  storage_path: string
  title: string
  updated_at: string | null
  version: string | null
}
  Insert: {
  course_id?: string | null
  created_at?: string | null
  created_by?: string | null
  description?: string | null
  entry_point: string
  file_size?: number | null
  id?: string
  manifest_data: Json
  organization_id?: string | null
  status?: string | null
  storage_path: string
  title: string
  updated_at?: string | null
  version?: string | null
}
  Update: {
  course_id?: string | null
  created_at?: string | null
  created_by?: string | null
  description?: string | null
  entry_point?: string
  file_size?: number | null
  id?: string
  manifest_data?: Json
  organization_id?: string | null
  status?: string | null
  storage_path?: string
  title?: string
  updated_at?: string | null
  version?: string | null
}
  Relationships: [
    { foreignKeyName: "scorm_packages_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "courses"; referencedColumns: ["id"] },
    { foreignKeyName: "scorm_packages_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "v_incomplete_lesson_times"; referencedColumns: ["course_id"] },
    { foreignKeyName: "scorm_packages_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "scorm_packages_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "scorm_packages_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "scorm_packages_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
    { foreignKeyName: "scorm_packages_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
    { foreignKeyName: "scorm_packages_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_stats"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "scorm_packages_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["organization_id"] },
  ]
}
