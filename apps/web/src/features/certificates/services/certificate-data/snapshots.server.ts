import { getFullUrl } from '@/lib/env'
import { SOFLIA_PLATFORM_BRAND } from '@/features/certificates/constants/certificate-branding'
import {
  buildCertificateSnapshots,
  parseCertificateBrandingSnapshot,
  parseCertificateDocumentSnapshot,
  shouldRebuildSnapshots,
  toCertificateJson,
} from '@/features/certificates/services/certificate-document.service'
import { getDisplayName } from './display-name'
import type { CertificateRow, CertificateUpdate } from './types'
import type { buildCertificateResolutionContext } from './resolution-context.server'

type ResolutionContext = ReturnType<typeof buildCertificateResolutionContext>

export function resolveSnapshots(
  row: CertificateRow,
  context: ResolutionContext,
): {
  brandingSnapshot: ReturnType<typeof parseCertificateBrandingSnapshot>
  documentSnapshot: ReturnType<typeof parseCertificateDocumentSnapshot>
  updatePayload: CertificateUpdate
} {
  let brandingSnapshot = parseCertificateBrandingSnapshot(row.branding_snapshot)
  let documentSnapshot = parseCertificateDocumentSnapshot(row.document_snapshot)
  const updatePayload: CertificateUpdate = {}

  if (mustRebuildSnapshots(row, context, brandingSnapshot, documentSnapshot)) {
    const rebuiltSnapshots = buildCertificateSnapshots({
      organizationId: context.effectiveOrganizationId,
      organizationName: context.organization?.name || null,
      organizationLogoUrl: context.organization?.brand_logo_url || context.organization?.logo_url || null,
      organizationPrimaryColor: context.organization?.brand_color_primary || null,
      organizationAccentColor: context.organization?.brand_color_accent || null,
      organizationSecondaryColor: context.organization?.brand_color_secondary || null,
      templateId: context.template?.id || null,
      templateDesignConfig: context.template?.design_config || null,
      learnerName: getDisplayName(context.learner, 'Estudiante'),
      courseTitle: row.courses?.title || 'Curso sin título',
      instructorName: getDisplayName(context.instructor, 'Instructor'),
      instructorSignatureUrl: context.instructor?.signature_url || null,
      instructorSignatureName: context.instructor?.signature_name || null,
      issuedAt: row.issued_at,
    })

    brandingSnapshot = rebuiltSnapshots.brandingSnapshot
    documentSnapshot = rebuiltSnapshots.documentSnapshot
    updatePayload.branding_snapshot = toCertificateJson(rebuiltSnapshots.brandingSnapshot)
    updatePayload.document_snapshot = toCertificateJson(rebuiltSnapshots.documentSnapshot)
  }

  return { brandingSnapshot, documentSnapshot, updatePayload }
}

function mustRebuildSnapshots(
  row: CertificateRow,
  context: ResolutionContext,
  brandingSnapshot: ReturnType<typeof parseCertificateBrandingSnapshot>,
  documentSnapshot: ReturnType<typeof parseCertificateDocumentSnapshot>,
) {
  const expectedPlatformLogoUrl = getFullUrl(SOFLIA_PLATFORM_BRAND.logoUrl)
  const expectedIssuerName = context.organization?.name || 'SofLIA'
  const expectedIssuerLogoUrl =
    context.organization?.brand_logo_url || context.organization?.logo_url || null
  const expectedProgramText = `Forma parte del programa de capacitación de ${expectedIssuerName}`

  return (
    shouldRebuildSnapshots(brandingSnapshot, documentSnapshot) ||
    !brandingSnapshot ||
    brandingSnapshot.platform.name !== SOFLIA_PLATFORM_BRAND.name ||
    brandingSnapshot.platform.logoUrl !== expectedPlatformLogoUrl ||
    brandingSnapshot.issuer.organizationId !== context.effectiveOrganizationId ||
    brandingSnapshot.issuer.name !== expectedIssuerName ||
    (brandingSnapshot.issuer.logoUrl || null) !== expectedIssuerLogoUrl ||
    !documentSnapshot ||
    documentSnapshot.programText !== expectedProgramText
  )
}
