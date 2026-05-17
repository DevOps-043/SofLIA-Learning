import { buildCertificateDocumentModel } from '@/features/certificates/services/certificate-document.service'
import type { CertificateListItem } from '@/features/certificates/types/certificate'
import { ensureCertificateHash } from './certificate-hash.server'
import { hasOwnKeys } from './errors'
import { persistCertificateUpdate } from './persist-update.server'
import { buildCertificateResolutionContext } from './resolution-context.server'
import { resolveSnapshots } from './snapshots.server'
import type { CertificateResolutionDependencies, CertificateRow, SupabaseServerClient } from './types'

export async function resolveCertificateRecord(
  supabase: SupabaseServerClient,
  row: CertificateRow,
  dependencies: CertificateResolutionDependencies,
): Promise<CertificateListItem> {
  const context = buildCertificateResolutionContext(row, dependencies)
  const { brandingSnapshot, documentSnapshot, updatePayload } = resolveSnapshots(row, context)

  if (row.organization_id !== context.effectiveOrganizationId) {
    updatePayload.organization_id = context.effectiveOrganizationId
  }

  if ((row.template_id || null) !== (context.template?.id || null)) {
    updatePayload.template_id = context.template?.id || null
  }

  const certificateHash = await ensureCertificateHash(supabase, row)

  if (hasOwnKeys(updatePayload)) {
    await persistCertificateUpdate(
      supabase,
      row.certificate_id,
      dependencies.supportsSnapshots,
      updatePayload,
    )
  }

  if (!brandingSnapshot || !documentSnapshot) {
    throw new Error(`No se pudieron resolver snapshots para ${row.certificate_id}`)
  }

  const documentModel = buildCertificateDocumentModel({
    certificateId: row.certificate_id,
    certificateHash,
    certificateUrl: row.certificate_url,
    issuedAt: row.issued_at,
    expiresAt: row.expires_at,
    courseId: row.course_id,
    courseSlug: row.courses?.slug || null,
    enrollmentId: row.enrollment_id,
    brandingSnapshot,
    documentSnapshot,
  })

  return {
    certificateId: row.certificate_id,
    certificateHash,
    issuedAt: row.issued_at,
    expiresAt: row.expires_at,
    courseTitle: documentSnapshot.courseTitle,
    instructorName: documentSnapshot.instructorName,
    issuerName: brandingSnapshot.issuer.name,
    issuerLogoUrl: brandingSnapshot.issuer.logoUrl,
    certificateUrl: row.certificate_url,
    documentModel,
  }
}
