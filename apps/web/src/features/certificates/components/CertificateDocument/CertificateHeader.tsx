import type { CertificateDocumentModel } from '@/features/certificates/types/certificate'
import { buildFrameStyle } from './utils'
import { IssuerLogo, PlatformLogo } from './logos'

export function CertificateHeader({ model, softSurfaceColor }: { model: CertificateDocumentModel; softSurfaceColor: string }) {
  const { borderColor, mutedColor, primaryColor } = model.branding.visualTokens
  const platformFrameStyle = buildFrameStyle({ width: '146px', height: '68px', borderColor, backgroundColor: softSurfaceColor, padding: '10px' })
  const issuerFrameStyle = buildFrameStyle({ width: '194px', height: '68px', borderColor, backgroundColor: softSurfaceColor, padding: '10px 14px' })

  return (
    <header style={{ display: 'grid', gridTemplateColumns: '146px 1fr 194px', alignItems: 'center', gap: '20px' }}>
      <div style={platformFrameStyle}><PlatformLogo model={model} /></div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '14px', color: mutedColor, fontSize: '13px', lineHeight: 1.2, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0 }}>
          <span style={{ width: '72px', height: '2px', background: 'linear-gradient(90deg, transparent, ' + borderColor + ')' }} />
          Certificado de finalizacion
          <span style={{ width: '72px', height: '2px', background: 'linear-gradient(90deg, ' + borderColor + ', transparent)' }} />
        </div>
        <div style={{ marginTop: '8px', fontSize: '12px', lineHeight: 1.2, color: mutedColor, fontWeight: 600 }}>Credencial verificable de aprendizaje</div>
      </div>
      <div style={issuerFrameStyle}><IssuerLogo model={model} primaryColor={primaryColor} /></div>
    </header>
  )
}
