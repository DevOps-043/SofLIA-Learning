import type { CertificateDocumentModel } from '@/features/certificates/types/certificate'

export function CertificateMetadata({ model }: { model: CertificateDocumentModel }) {
  const { borderColor, mutedColor, primaryColor } = model.branding.visualTokens
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,0.95fr) minmax(0,1.25fr)', gap: '18px', borderRadius: '14px', border: '1px solid ' + borderColor, background: 'rgba(255,255,255,0.74)', padding: '12px 16px' }}>
      <MetadataField label="Folio" value={model.certificateId} labelColor={mutedColor} valueColor={primaryColor} />
      <MetadataField label="Hash SHA-256" value={model.certificateHash} labelColor={mutedColor} valueColor={mutedColor} small />
    </div>
  )
}

function MetadataField({ label, labelColor, small = false, value, valueColor }: { label: string; labelColor: string; small?: boolean; value: string; valueColor: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: '10px', lineHeight: 1.2, textTransform: 'uppercase', letterSpacing: 0, color: labelColor, fontWeight: 800, marginBottom: '5px' }}>{label}</div>
      <div style={{ fontSize: small ? '10.5px' : '12px', lineHeight: small ? 1.35 : 1.3, fontWeight: small ? 600 : 800, color: valueColor, wordBreak: 'break-all' }}>{value}</div>
    </div>
  )
}
