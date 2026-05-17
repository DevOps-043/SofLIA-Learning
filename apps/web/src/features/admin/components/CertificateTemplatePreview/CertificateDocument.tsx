import { CertificateBrand } from './CertificateBrand'
import { CertificateFooter } from './CertificateFooter'
import { CertificateFrame } from './CertificateFrame'
import { CertificateMainText } from './CertificateMainText'
import type { CertificatePreviewData, CertificateTemplate } from './types'

interface CertificateDocumentProps {
  data: CertificatePreviewData
  isExpanded?: boolean
  template: CertificateTemplate
}

export function CertificateDocument({
  data,
  isExpanded = false,
  template,
}: CertificateDocumentProps) {
  const { primaryColor, secondaryColor, accentColor } = template.preview
  return (
    <div className={`relative ${isExpanded ? 'w-full' : 'aspect-[8.5/11] overflow-hidden'}`} style={isExpanded ? { aspectRatio: '8.5 / 11', maxWidth: '816px', margin: '0 auto', minHeight: '1056px' } : {}}>
      <CertificateFrame accentColor={accentColor} isExpanded={isExpanded} primaryColor={primaryColor} secondaryColor={secondaryColor}>
        <div className="flex flex-col justify-between items-center text-center h-full">
          <CertificateBrand primaryColor={primaryColor} />
          <CertificateMainText accentColor={accentColor} data={data} primaryColor={primaryColor} secondaryColor={secondaryColor} />
          <CertificateFooter accentColor={accentColor} data={data} primaryColor={primaryColor} secondaryColor={secondaryColor} />
        </div>
      </CertificateFrame>
    </div>
  )
}
