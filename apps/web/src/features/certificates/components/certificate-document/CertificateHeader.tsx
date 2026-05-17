import { renderIssuerLogo, renderPlatformLogo } from './CertificateLogos'
import type { CertificateHeaderProps } from './types'

export function CertificateHeader({
  model,
  borderColor,
  issuerFrameStyle,
  mutedColor,
  platformFrameStyle,
  primaryColor,
}: CertificateHeaderProps) {
  return (
    <header
      style={{
        display: 'grid',
        gridTemplateColumns: '146px 1fr 194px',
        alignItems: 'center',
        gap: '20px',
      }}
    >
      <div style={platformFrameStyle}>{renderPlatformLogo(model)}</div>

      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '14px',
            color: mutedColor,
            fontSize: '13px',
            lineHeight: 1.2,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: 0,
          }}
        >
          <span style={{ width: '72px', height: '2px', background: `linear-gradient(90deg, transparent, ${borderColor})` }} />
          Certificado de finalizacion
          <span style={{ width: '72px', height: '2px', background: `linear-gradient(90deg, ${borderColor}, transparent)` }} />
        </div>

        <div style={{ marginTop: '8px', fontSize: '12px', lineHeight: 1.2, color: mutedColor, fontWeight: 600 }}>
          Credencial verificable de aprendizaje
        </div>
      </div>

      <div style={issuerFrameStyle}>{renderIssuerLogo(model, primaryColor)}</div>
    </header>
  )
}
