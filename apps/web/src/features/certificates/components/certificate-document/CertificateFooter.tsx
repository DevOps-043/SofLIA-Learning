import { CertificateMetaPanel } from './CertificateMetaPanel'
import { CertificateVerification } from './CertificateVerification'
import { renderSignatureContent } from './CertificateSignature'
import { LineField } from './LineField'
import type { CertificateSectionProps } from './types'
import { formatCertificateDate } from './utils'

export function CertificateFooter({
  model,
  tokens,
  surfaceColor,
}: CertificateSectionProps & { surfaceColor: string }) {
  return (
    <footer style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 154px minmax(0,1fr)', gap: '28px', alignItems: 'end' }}>
        <LineField
          label="Instructor"
          borderColor={tokens.borderColor}
          mutedColor={tokens.mutedColor}
          primaryColor={tokens.primaryColor}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
            {renderSignatureContent(model)}
            <div style={{ fontSize: '22px', lineHeight: 1.2, fontWeight: 850, color: tokens.primaryColor, wordBreak: 'break-word' }}>
              {model.document.instructorName}
            </div>
          </div>
        </LineField>

        <CertificateVerification
          borderColor={tokens.borderColor}
          model={model}
          mutedColor={tokens.mutedColor}
          primaryColor={tokens.primaryColor}
          surfaceColor={surfaceColor}
        />

        <LineField
          label="Fecha de emision"
          borderColor={tokens.borderColor}
          mutedColor={tokens.mutedColor}
          primaryColor={tokens.primaryColor}
          align="right"
        >
          <div style={{ fontSize: '22px', lineHeight: 1.2, fontWeight: 850, color: tokens.textColor }}>
            {formatCertificateDate(model.document.issuedAt)}
          </div>
        </LineField>
      </div>

      <CertificateMetaPanel
        borderColor={tokens.borderColor}
        model={model}
        mutedColor={tokens.mutedColor}
        primaryColor={tokens.primaryColor}
      />
    </footer>
  )
}
