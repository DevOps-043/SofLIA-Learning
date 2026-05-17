import type { CSSProperties, ReactNode } from 'react'
import type { CertificateDocumentModel } from '@/features/certificates/types/certificate'

export interface CertificateDocumentProps {
  model: CertificateDocumentModel
  className?: string
}

export interface LineFieldProps {
  label: string
  description?: string
  children: ReactNode
  borderColor: string
  mutedColor: string
  primaryColor: string
  align?: 'left' | 'center' | 'right'
}

export interface CertificateSectionProps {
  model: CertificateDocumentModel
  tokens: CertificateDocumentModel['branding']['visualTokens']
}

export interface CertificateHeaderProps {
  model: CertificateDocumentModel
  borderColor: string
  issuerFrameStyle: CSSProperties
  mutedColor: string
  platformFrameStyle: CSSProperties
  primaryColor: string
}
