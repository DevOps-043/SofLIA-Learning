import type { ReactNode } from 'react'
import type { CertificateDocumentModel } from '@/features/certificates/types/certificate'

export function renderSignatureContent(model: CertificateDocumentModel): ReactNode {
  const signatureUrl = model.document.instructorSignatureUrl
  const signatureName = model.document.instructorSignatureName?.trim()

  if (signatureUrl) {
    return (
      <img
        src={signatureUrl}
        alt={`Firma de ${model.document.instructorName}`}
        loading="eager"
        style={{ maxWidth: '230px', maxHeight: '46px', objectFit: 'contain' }}
      />
    )
  }

  if (!signatureName) return null

  return (
    <div
      style={{
        fontSize: '24px',
        lineHeight: 1,
        color: model.branding.visualTokens.primaryColor,
        fontFamily: '"Brush Script MT", "Segoe Script", cursive',
      }}
    >
      {signatureName}
    </div>
  )
}
