import { CertificateQrBlock } from './QrBlock'
import { InstructorSignature } from './InstructorSignature'
import type { CertificatePreviewData } from './types'

interface CertificateFooterProps {
  accentColor: string
  data: CertificatePreviewData
  primaryColor: string
  secondaryColor: string
}

export function CertificateFooter({
  accentColor,
  data,
  primaryColor,
  secondaryColor,
}: CertificateFooterProps) {
  return (
    <div className="flex justify-between items-center w-full mt-6 px-8 pb-4 border-t-2 pt-6" style={{ borderColor: accentColor }}>
      <div className="text-center flex-1 flex flex-col items-center justify-center">
        <InstructorSignature data={data} primaryColor={primaryColor} />
      </div>
      <CertificateQrBlock certificateHash={data.certificateHash} primaryColor={primaryColor} />
      <div className="text-center flex-1 flex flex-col items-center justify-center">
        <div className="text-sm font-semibold mb-3" style={{ color: primaryColor }}>Fecha de Emisión</div>
        <div className="text-base font-medium text-gray-700 border-2 rounded px-4 py-2 inline-block" style={{ borderColor: secondaryColor }}>
          {data.issueDate}
        </div>
      </div>
    </div>
  )
}
