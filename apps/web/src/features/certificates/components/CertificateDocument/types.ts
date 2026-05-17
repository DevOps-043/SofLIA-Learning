import type { ReactNode } from 'react'
import type { CertificateDocumentModel } from '@/features/certificates/types/certificate'

export interface CertificateDocumentProps {
  model: CertificateDocumentModel
  className?: string
}

export interface CertificateDocumentColors {
  accentLine: string
  accentSoft: string
  primaryLine: string
  primarySoft: string
  softSurfaceColor: string
  surfaceColor: string
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
