import type { Json } from '../json'

export type UserCourseCertificatesTable = {
  Row: {
  branding_snapshot: Json | null
  certificate_hash: string | null
  certificate_id: string
  certificate_url: string
  course_id: string
  created_at: string
  document_snapshot: Json | null
  enrollment_id: string
  expires_at: string | null
  issued_at: string
  organization_id: string | null
  template_id: string | null
  user_id: string
}
  Insert: {
  branding_snapshot?: Json | null
  certificate_hash?: string | null
  certificate_id?: string
  certificate_url: string
  course_id: string
  created_at?: string
  document_snapshot?: Json | null
  enrollment_id: string
  expires_at?: string | null
  issued_at?: string
  organization_id?: string | null
  template_id?: string | null
  user_id: string
}
  Update: {
  branding_snapshot?: Json | null
  certificate_hash?: string | null
  certificate_id?: string
  certificate_url?: string
  course_id?: string
  created_at?: string
  document_snapshot?: Json | null
  enrollment_id?: string
  expires_at?: string | null
  issued_at?: string
  organization_id?: string | null
  template_id?: string | null
  user_id?: string
}
  Relationships: [
    { foreignKeyName: "user_course_certificates_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "courses"; referencedColumns: ["id"] },
    { foreignKeyName: "user_course_certificates_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "v_incomplete_lesson_times"; referencedColumns: ["course_id"] },
    { foreignKeyName: "user_course_certificates_enrollment_id_fkey"; columns: ["enrollment_id"]; isOneToOne: false; referencedRelation: "user_course_enrollments"; referencedColumns: ["enrollment_id"] },
    { foreignKeyName: "user_course_certificates_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
    { foreignKeyName: "user_course_certificates_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_stats"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "user_course_certificates_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["organization_id"] },
    { foreignKeyName: "user_course_certificates_template_id_fkey"; columns: ["template_id"]; isOneToOne: false; referencedRelation: "certificate_templates"; referencedColumns: ["id"] },
    { foreignKeyName: "user_course_certificates_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
    { foreignKeyName: "user_course_certificates_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
    { foreignKeyName: "user_course_certificates_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
    { foreignKeyName: "user_course_certificates_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  ]
}
