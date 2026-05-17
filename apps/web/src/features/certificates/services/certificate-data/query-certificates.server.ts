import { isMissingSnapshotColumnsError } from './errors'
import type { CertificateRow, QueryCertificatesResult, SupabaseServerClient } from './types'

interface CertificateFilters {
  userId?: string
  certificateId?: string
  certificateHash?: string
}

export async function queryCertificates(
  supabase: SupabaseServerClient,
  filters: CertificateFilters,
): Promise<QueryCertificatesResult> {
  const { data, error } = await buildCertificateQuery(supabase, filters, true)

  if (!error) {
    return {
      rows: (data || []) as CertificateRow[],
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
    rows: ((fallbackData || []) as Array<Omit<CertificateRow, 'branding_snapshot' | 'document_snapshot'>>)
      .map(row => ({ ...row, branding_snapshot: null, document_snapshot: null })),
    supportsSnapshots: false,
  }
}

function buildCertificateQuery(
  supabase: SupabaseServerClient,
  filters: CertificateFilters,
  supportsSnapshots: boolean,
) {
  const snapshotFields = supportsSnapshots
    ? `,
      branding_snapshot,
      document_snapshot`
    : ''
  let query = supabase
    .from('user_course_certificates')
    .select(`
      certificate_id, certificate_url, certificate_hash, issued_at, expires_at,
      created_at, course_id, enrollment_id, organization_id, template_id,
      user_id${snapshotFields}, courses (id, title, slug, instructor_id)
    `)
    .order('issued_at', { ascending: false })

  if (filters.userId) query = query.eq('user_id', filters.userId)
  if (filters.certificateId) query = query.eq('certificate_id', filters.certificateId)
  if (filters.certificateHash) query = query.eq('certificate_hash', filters.certificateHash)

  return query
}
