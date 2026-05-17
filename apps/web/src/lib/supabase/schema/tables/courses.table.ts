import type { Json } from '../json'

export type CoursesTable = {
  Row: {
  approval_status: string | null
  approved_at: string | null
  approved_by: string | null
  average_rating: number | null
  category: string
  created_at: string | null
  description: string | null
  duration_total_minutes: number | null
  id: string
  instructor_id: string | null
  is_active: boolean | null
  learning_objectives: Json | null
  level: string
  price: number | null
  rejection_reason: string | null
  review_count: number | null
  slug: string
  student_count: number | null
  thumbnail_url: string | null
  title: string
  updated_at: string | null
}
  Insert: {
  approval_status?: string | null
  approved_at?: string | null
  approved_by?: string | null
  average_rating?: number | null
  category?: string
  created_at?: string | null
  description?: string | null
  duration_total_minutes?: number | null
  id?: string
  instructor_id?: string | null
  is_active?: boolean | null
  learning_objectives?: Json | null
  level?: string
  price?: number | null
  rejection_reason?: string | null
  review_count?: number | null
  slug: string
  student_count?: number | null
  thumbnail_url?: string | null
  title: string
  updated_at?: string | null
}
  Update: {
  approval_status?: string | null
  approved_at?: string | null
  approved_by?: string | null
  average_rating?: number | null
  category?: string
  created_at?: string | null
  description?: string | null
  duration_total_minutes?: number | null
  id?: string
  instructor_id?: string | null
  is_active?: boolean | null
  learning_objectives?: Json | null
  level?: string
  price?: number | null
  rejection_reason?: string | null
  review_count?: number | null
  slug?: string
  student_count?: number | null
  thumbnail_url?: string | null
  title?: string
  updated_at?: string | null
}
  Relationships: [
    { foreignKeyName: "courses_approved_by_fkey"; columns: ["approved_by"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "courses_approved_by_fkey"; columns: ["approved_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "courses_approved_by_fkey"; columns: ["approved_by"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "courses_approved_by_fkey"; columns: ["approved_by"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
    { foreignKeyName: "fk_courses_instructor"; columns: ["instructor_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "fk_courses_instructor"; columns: ["instructor_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "fk_courses_instructor"; columns: ["instructor_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "fk_courses_instructor"; columns: ["instructor_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
