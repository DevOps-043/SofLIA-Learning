import { createAdminClient } from '@/lib/supabase/admin'
import type { Database, Json } from '@/lib/supabase/types'
import type { UserCourseCertificateRow } from '@/features/certificates/types/certificate'

export type SupabaseServerClient = ReturnType<typeof createAdminClient>
export type CertificateUpdate = Database['public']['Tables']['user_course_certificates']['Update']

export interface SupabaseErrorLike {
  code?: string | null
  message?: string | null
  details?: string | null
}

export interface QueryCertificatesResult {
  rows: CertificateRow[]
  supportsSnapshots: boolean
}

export interface CertificateCourseRow {
  id: string
  title: string | null
  slug: string | null
  instructor_id: string | null
}

export interface CertificateRow extends UserCourseCertificateRow {
  course_id: string
  user_id: string
  courses?: CertificateCourseRow | null
}

export interface OrganizationRow {
  id: string
  name: string
  logo_url: string | null
  brand_logo_url: string | null
  brand_color_primary: string | null
  brand_color_accent: string | null
  brand_color_secondary: string | null
}

export interface TemplateRow {
  id: string
  organization_id: string
  design_config: Json
  is_default: boolean | null
}

export interface EnrollmentOrganizationRow {
  enrollment_id: string
  organization_id: string | null
}

export interface UserProfileRow {
  id: string
  display_name: string | null
  first_name: string | null
  last_name: string | null
  username: string
  signature_name: string | null
  signature_url: string | null
}

export interface CertificateResolutionDependencies {
  supportsSnapshots: boolean
  enrollmentOrganizations: Map<string, string | null>
  organizations: Map<string, OrganizationRow>
  primaryOrganizations: Map<string, string>
  explicitTemplates: Map<string, TemplateRow>
  defaultTemplates: Map<string, TemplateRow>
  users: Map<string, UserProfileRow>
}
