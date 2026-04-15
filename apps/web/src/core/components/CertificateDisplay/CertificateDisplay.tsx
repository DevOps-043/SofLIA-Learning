'use client'

import { buildCertificateDocumentModel, buildCertificateSnapshots } from '@/features/certificates/services/certificate-document.service'
import { CertificateDocument } from '@/features/certificates/components/CertificateDocument'

interface CertificateDisplayProps {
  studentName: string
  courseName: string
  issueDate: string
  instructorSignatureUrl?: string | null
  instructorSignatureName?: string | null
  instructorDisplayName?: string | null
  certificateHash?: string | null
  className?: string
}

export function CertificateDisplay({
  studentName,
  courseName,
  issueDate,
  instructorSignatureUrl,
  instructorSignatureName,
  instructorDisplayName,
  certificateHash,
  className = '',
}: CertificateDisplayProps) {
  const snapshots = buildCertificateSnapshots({
    organizationId: null,
    organizationName: 'SofLIA',
    organizationLogoUrl: null,
    organizationPrimaryColor: null,
    organizationAccentColor: null,
    organizationSecondaryColor: null,
    templateId: null,
    templateDesignConfig: null,
    learnerName: studentName,
    courseTitle: courseName,
    instructorName: instructorDisplayName || 'Instructor',
    instructorSignatureUrl: instructorSignatureUrl || null,
    instructorSignatureName: instructorSignatureName || null,
    issuedAt: issueDate,
  })

  const model = buildCertificateDocumentModel({
    certificateId: 'preview-certificate',
    certificateHash: certificateHash || 'preview-hash',
    certificateUrl: null,
    issuedAt: issueDate,
    expiresAt: null,
    courseId: null,
    courseSlug: null,
    enrollmentId: null,
    brandingSnapshot: snapshots.brandingSnapshot,
    documentSnapshot: snapshots.documentSnapshot,
  })

  return <CertificateDocument model={model} className={className} />
}
