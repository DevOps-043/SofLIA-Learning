import { isMissingSnapshotColumnsError } from './errors'
import type { CertificateRow, QueryCertificatesResult, SupabaseServerClient } from './types'

interface CertificateFilters {
  userId?: string
  certificateId?: string
  certificateHash?: string
  organizationId?: string
}

const CERTIFICATE_SELECT_BASE =
  'certificate_id, certificate_url, certificate_hash, issued_at, expires_at, created_at, course_id, enrollment_id, organization_id, template_id, user_id, courses(id, title, slug, instructor_id)'

const CERTIFICATE_SELECT_WITH_SNAPSHOTS =
  'certificate_id, certificate_url, certificate_hash, issued_at, expires_at, created_at, course_id, enrollment_id, organization_id, template_id, user_id, branding_snapshot, document_snapshot, courses(id, title, slug, instructor_id)'

export async function queryCertificates(
  supabase: SupabaseServerClient,
  filters: CertificateFilters,
): Promise<QueryCertificatesResult> {
  const { data, error } = await buildCertificateQuery(supabase, filters, true)

  if (!error) {
    return {
      rows: (data || []) as unknown as CertificateRow[],
      supportsSnapshots: true,
    }
  }

  if (!isMissingSnapshotColumnsError(error)) {
    throw error
  }

  const { data: fallbackData, error: fallbackError } =
    await buildCertificateQuery(supabase, filters, false)

  if (fallbackError) {
    throw fallbackError
  }

  return {
    rows: ((fallbackData || []) as unknown as Array<Omit<CertificateRow, 'branding_snapshot' | 'document_snapshot'>>)
      .map(row => ({ ...row, branding_snapshot: null, document_snapshot: null })),
    supportsSnapshots: false,
  }
}

function buildCertificateQuery(
  supabase: SupabaseServerClient,
  filters: CertificateFilters,
  supportsSnapshots: boolean,
) {
  let query = supabase
    .from('user_course_certificates')
    .select(supportsSnapshots ? CERTIFICATE_SELECT_WITH_SNAPSHOTS : CERTIFICATE_SELECT_BASE)
    .order('issued_at', { ascending: false })

  if (filters.userId) query = query.eq('user_id', filters.userId)
  if (filters.certificateId) query = query.eq('certificate_id', filters.certificateId)
  if (filters.certificateHash) query = query.eq('certificate_hash', filters.certificateHash)
  if (filters.organizationId) query = query.eq('organization_id', filters.organizationId)

  return query
}
