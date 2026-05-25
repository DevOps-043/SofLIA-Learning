import { CertificateFooter } from './CertificateDocument/CertificateFooter'
import { CertificateFrame } from './CertificateDocument/CertificateFrame'
import { CertificateHeader } from './CertificateDocument/CertificateHeader'
import { CertificateMain } from './CertificateDocument/CertificateMain'
import type { CertificateDocumentProps } from './CertificateDocument/types'
import { buildDocumentColors } from './CertificateDocument/utils'

export function CertificateDocument({ model, className = '' }: CertificateDocumentProps) {
  const colors = buildDocumentColors(model)
  const { borderColor } = model.branding.visualTokens

  return (
    <CertificateFrame className={className} colors={colors} model={model}>
      <CertificateHeader model={model} softSurfaceColor={colors.softSurfaceColor} />
      <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent 0%, ' + borderColor + ' 18%, ' + borderColor + ' 82%, transparent 100%)' }} />
      <CertificateMain model={model} />
      <CertificateFooter model={model} surfaceColor={colors.surfaceColor} />
    </CertificateFrame>
  )
}
