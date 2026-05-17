import QRCode from 'react-qr-code'
import type { CertificateDocumentModel } from '@/features/certificates/types/certificate'

export function VerificationQr({ model, surfaceColor }: { model: CertificateDocumentModel; surfaceColor: string }) {
  const { borderColor, mutedColor, primaryColor } = model.branding.visualTokens
  return (
    <div style={{ minHeight: '130px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
      <div style={{ padding: '8px', borderRadius: '16px', background: surfaceColor, border: '1px solid ' + borderColor, boxShadow: '0 12px 24px rgba(15,23,42,0.08)' }}>
        <QRCode size={92} value={model.verificationUrl} fgColor={primaryColor} bgColor={surfaceColor} />
      </div>
      <div style={{ fontSize: '10px', lineHeight: 1.3, color: mutedColor, textAlign: 'center', fontWeight: 600 }}>Escanea para validar</div>
    </div>
  )
}
