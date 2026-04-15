import { CERTIFICATE_RENDER_HEIGHT_PX, CERTIFICATE_RENDER_WIDTH_PX } from '@/features/certificates/constants/certificate-branding'
import { CertificateDocument } from '@/features/certificates/components/CertificateDocument'
import type { CertificateDocumentModel } from '@/features/certificates/types/certificate'

interface CertificateDocumentPreviewProps {
  model: CertificateDocumentModel
  scale?: number
}

export function CertificateDocumentPreview({
  model,
  scale = 0.26,
}: CertificateDocumentPreviewProps) {
  return (
    <div
      style={{
        width: `${CERTIFICATE_RENDER_WIDTH_PX * scale}px`,
        height: `${CERTIFICATE_RENDER_HEIGHT_PX * scale}px`,
        overflow: 'hidden',
        borderRadius: '20px',
      }}
    >
      <div
        style={{
          width: `${CERTIFICATE_RENDER_WIDTH_PX}px`,
          height: `${CERTIFICATE_RENDER_HEIGHT_PX}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        <CertificateDocument model={model} />
      </div>
    </div>
  )
}
