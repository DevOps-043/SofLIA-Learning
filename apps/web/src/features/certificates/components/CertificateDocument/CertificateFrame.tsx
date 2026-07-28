import { CERTIFICATE_RENDER_HEIGHT_PX, CERTIFICATE_RENDER_WIDTH_PX } from '@/features/certificates/constants/certificate-branding'
import type { CertificateDocumentModel } from '@/features/certificates/types/certificate'
import type { CertificateDocumentColors } from './types'

export function CertificateFrame({ children, className, colors, model }: {
  children: React.ReactNode
  className: string
  colors: CertificateDocumentColors
  model: CertificateDocumentModel
}) {
  const { accentColor, backgroundColor, borderColor, primaryColor, textColor } = model.branding.visualTokens
  return (
    <div className={className} data-certificate-root="true" style={{ width: CERTIFICATE_RENDER_WIDTH_PX + 'px', height: CERTIFICATE_RENDER_HEIGHT_PX + 'px', position: 'relative', overflow: 'hidden', borderRadius: '24px', border: '1px solid ' + borderColor, background: 'radial-gradient(circle at 12% 10%, ' + colors.accentSoft + ' 0%, transparent 26%), radial-gradient(circle at 96% 0%, ' + colors.primarySoft + ' 0%, transparent 30%), linear-gradient(135deg, ' + backgroundColor + ' 0%, ' + colors.surfaceColor + ' 54%, rgb(245,250,255) 100%)', boxShadow: '0 24px 60px rgba(15,23,42,0.14)', color: textColor, fontFamily: 'var(--font-system-ui)' }}>
      <div style={{ position: 'absolute', inset: '15px', borderRadius: '20px', border: '1px solid ' + borderColor, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: '28px', borderRadius: '16px', border: '1px solid ' + colors.primaryLine, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '9px', background: 'linear-gradient(90deg, ' + primaryColor + ' 0%, ' + accentColor + ' 100%)' }} />
      <div style={{ position: 'absolute', right: '-84px', top: '-92px', width: '260px', height: '260px', borderRadius: '50%', border: '42px solid ' + colors.accentLine, opacity: 0.55, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', gap: '16px', padding: '30px 38px 30px' }}>{children}</div>
    </div>
  )
}
