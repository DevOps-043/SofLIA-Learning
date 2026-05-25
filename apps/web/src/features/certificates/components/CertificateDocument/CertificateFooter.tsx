import type { CertificateDocumentModel } from '@/features/certificates/types/certificate'
import { CertificateMetadata } from './CertificateMetadata'
import { LineField } from './LineField'
import { SignatureContent } from './Signature'
import { formatCertificateDate } from './utils'
import { VerificationQr } from './VerificationQr'

export function CertificateFooter({ model, surfaceColor }: { model: CertificateDocumentModel; surfaceColor: string }) {
  const { borderColor, mutedColor, primaryColor, textColor } = model.branding.visualTokens
  return (
    <footer style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 154px minmax(0,1fr)', gap: '28px', alignItems: 'end' }}>
        <LineField label="Instructor" borderColor={borderColor} mutedColor={mutedColor} primaryColor={primaryColor}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
            <SignatureContent model={model} />
            <div style={{ fontSize: '22px', lineHeight: 1.2, fontWeight: 850, color: primaryColor, wordBreak: 'break-word' }}>{model.document.instructorName}</div>
          </div>
        </LineField>
        <VerificationQr model={model} surfaceColor={surfaceColor} />
        <LineField label="Fecha de emision" borderColor={borderColor} mutedColor={mutedColor} primaryColor={primaryColor} align="right">
          <div style={{ fontSize: '22px', lineHeight: 1.2, fontWeight: 850, color: textColor }}>{formatCertificateDate(model.document.issuedAt)}</div>
        </LineField>
      </div>
      <CertificateMetadata model={model} />
    </footer>
  )
}
