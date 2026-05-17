import type { CertificateDocumentModel } from '@/features/certificates/types/certificate'

function CertificateMetaValue({
  label,
  children,
  labelColor,
  valueColor,
  valueSize,
}: {
  label: string
  children: string
  labelColor: string
  valueColor: string
  valueSize: string
}) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: '10px', lineHeight: 1.2, textTransform: 'uppercase', letterSpacing: 0, color: labelColor, fontWeight: 800, marginBottom: '5px' }}>
        {label}
      </div>
      <div style={{ fontSize: valueSize, lineHeight: 1.35, color: valueColor, wordBreak: 'break-all', fontWeight: 600 }}>
        {children}
      </div>
    </div>
  )
}

export function CertificateMetaPanel({
  borderColor,
  model,
  mutedColor,
  primaryColor,
}: {
  borderColor: string
  model: CertificateDocumentModel
  mutedColor: string
  primaryColor: string
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,0.95fr) minmax(0,1.25fr)',
        gap: '18px',
        borderRadius: '14px',
        border: `1px solid ${borderColor}`,
        background: 'rgba(255,255,255,0.74)',
        padding: '12px 16px',
      }}
    >
      <CertificateMetaValue label="Folio" labelColor={mutedColor} valueColor={primaryColor} valueSize="12px">
        {model.certificateId}
      </CertificateMetaValue>
      <CertificateMetaValue label="Hash SHA-256" labelColor={mutedColor} valueColor={mutedColor} valueSize="10.5px">
        {model.certificateHash}
      </CertificateMetaValue>
    </div>
  )
}
