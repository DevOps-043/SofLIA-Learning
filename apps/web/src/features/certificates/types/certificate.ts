import type { Database } from '@/lib/supabase/types'

export interface CertificateVisualTokens {
  primaryColor: string
  accentColor: string
  borderColor: string
  backgroundColor: string
  textColor: string
  mutedColor: string
}

export interface CertificatePlatformBrand {
  name: string
  logoUrl: string
}

export interface CertificateIssuerBrand {
  organizationId: string | null
  name: string
  logoUrl: string | null
}

export interface CertificateBrandingSnapshot {
  platform: CertificatePlatformBrand
  issuer: CertificateIssuerBrand
  visualTokens: CertificateVisualTokens
  legacyMode: boolean
}

export interface CertificateDocumentSnapshot {
  learnerName: string
  courseTitle: string
  instructorName: string
  instructorSignatureUrl: string | null
  instructorSignatureName: string | null
  issuedAt: string
  programText: string
}

export interface CertificateDocumentModel {
  certificateId: string
  certificateHash: string
  certificateUrl: string | null
  issuedAt: string
  expiresAt: string | null
  verificationUrl: string
  fileName: string
  courseId: string | null
  courseSlug: string | null
  enrollmentId: string | null
  branding: CertificateBrandingSnapshot
  document: CertificateDocumentSnapshot
}

export interface CertificateListItem {
  certificateId: string
  certificateHash: string
  issuedAt: string
  expiresAt: string | null
  courseTitle: string
  instructorName: string
  issuerName: string
  issuerLogoUrl: string | null
  certificateUrl: string | null
  documentModel: CertificateDocumentModel
}

export interface CertificateVerificationResult {
  valid: boolean
  expired: boolean
  chainOk: boolean
  lastOperation: string | null
  lastBlockAt: string | null
  certificate: CertificateListItem
}

export type UserCourseCertificateRow =
  Database['public']['Tables']['user_course_certificates']['Row']
