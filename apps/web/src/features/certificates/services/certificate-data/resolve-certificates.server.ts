import { loadPrimaryOrganizationIdsMap, resolveEffectiveOrganizationId } from '@/features/certificates/services/certificate-organization.server'
import { loadEnrollmentsMap } from './load-enrollments.server'
import { loadOrganizationsMap } from './load-organizations.server'
import { loadTemplates } from './load-templates.server'
import { loadUsersMap } from './load-users.server'
import { resolveCertificateRecord } from './resolve-certificate-record.server'
import type { QueryCertificatesResult, SupabaseServerClient } from './types'

export async function resolveCertificates(
  supabase: SupabaseServerClient,
  result: QueryCertificatesResult,
) {
  const { rows, supportsSnapshots } = result

  if (rows.length === 0) {
    return []
  }

  const enrollmentOrganizations = await loadEnrollmentsMap(supabase, rows)
  const primaryOrganizations = await loadPrimaryOrganizationIdsMap(
    supabase,
    rows.map(row => row.user_id),
  )
  const organizationIds = [...new Set(rows
    .map(row =>
      resolveEffectiveOrganizationId({
        certificateOrganizationId: row.organization_id,
        enrollmentId: row.enrollment_id,
        enrollmentOrganizations,
        primaryOrganizations,
        userId: row.user_id,
      }),
    )
    .filter((value): value is string => Boolean(value)))]
  const organizations = await loadOrganizationsMap(supabase, organizationIds)
  const templates = await loadTemplates(supabase, rows, organizationIds)
  const userIds = [...new Set([
    ...rows.map(row => row.user_id),
    ...rows.map(row => row.courses?.instructor_id).filter((value): value is string => Boolean(value)),
  ])]
  const users = await loadUsersMap(supabase, userIds)

  return Promise.all(
    rows.map(row =>
      resolveCertificateRecord(supabase, row, {
        supportsSnapshots,
        enrollmentOrganizations,
        organizations,
        primaryOrganizations,
        explicitTemplates: templates.explicitTemplates,
        defaultTemplates: templates.defaultTemplates,
        users,
      }),
    ),
  )
}
