import { resolveEffectiveOrganizationId } from '@/features/certificates/services/certificate-organization.server'
import type { CertificateResolutionDependencies, CertificateRow } from './types'

export function buildCertificateResolutionContext(
  row: CertificateRow,
  dependencies: CertificateResolutionDependencies,
) {
  const learner = dependencies.users.get(row.user_id) || null
  const instructorId = row.courses?.instructor_id || null
  const instructor = instructorId ? dependencies.users.get(instructorId) || null : null
  const effectiveOrganizationId = resolveEffectiveOrganizationId({
    certificateOrganizationId: row.organization_id,
    enrollmentId: row.enrollment_id,
    enrollmentOrganizations: dependencies.enrollmentOrganizations,
    primaryOrganizations: dependencies.primaryOrganizations,
    userId: row.user_id,
  })
  const organization = effectiveOrganizationId
    ? dependencies.organizations.get(effectiveOrganizationId) || null
    : null
  const template =
    (row.template_id ? dependencies.explicitTemplates.get(row.template_id) : null) ||
    (effectiveOrganizationId ? dependencies.defaultTemplates.get(effectiveOrganizationId) : null) ||
    null

  return {
    effectiveOrganizationId,
    instructor,
    learner,
    organization,
    template,
  }
}
