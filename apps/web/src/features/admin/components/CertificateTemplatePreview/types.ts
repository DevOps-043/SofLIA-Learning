export interface CertificateTemplate {
  id: string
  name: string
  description: string
  preview: {
    primaryColor: string
    secondaryColor: string
    accentColor: string
    style: 'default'
  }
}

export interface CertificateTemplatePreviewProps {
  isOpen: boolean
  onClose: () => void
  selectedTemplate: string
  onSelectTemplate: (templateId: string) => void
  instructorSignatureUrl?: string | null
  instructorSignatureName?: string | null
  instructorDisplayName?: string | null
  certificateHash?: string | null
  studentName?: string
  courseName?: string
  issueDate?: string
}

export interface CertificatePreviewData {
  instructorSignatureUrl?: string | null
  instructorSignatureName?: string | null
  instructorDisplayName?: string | null
  certificateHash?: string | null
  studentName: string
  courseName: string
  issueDate: string
}
