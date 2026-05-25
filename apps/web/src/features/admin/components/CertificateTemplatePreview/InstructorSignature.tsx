import type { CertificatePreviewData } from './types'

interface InstructorSignatureProps {
  data: CertificatePreviewData
  primaryColor: string
}

export function InstructorSignature({ data, primaryColor }: InstructorSignatureProps) {
  const signatureName = data.instructorSignatureName?.trim()
  const signatureUrl = data.instructorSignatureUrl?.trim()

  if (signatureName && !signatureUrl) {
    return (
      <>
        <div className="text-base font-bold mb-3 px-2" style={{ color: primaryColor }}>{signatureName}</div>
        <div className="h-1 w-40 border-b-4 mx-auto mb-3" style={{ borderColor: primaryColor }} />
        <div className="text-xs text-gray-600">Instructor</div>
      </>
    )
  }

  if (signatureUrl) {
    return (
      <>
        <div className="mb-3 flex justify-center">
          <img src={signatureUrl} alt="Firma del instructor" className="h-20 w-48 object-contain" />
        </div>
        <div className="h-1 w-40 border-b-4 mx-auto mb-3" style={{ borderColor: primaryColor }} />
        {data.instructorDisplayName ? (
          <div className="text-base font-bold px-2" style={{ color: primaryColor }}>{data.instructorDisplayName}</div>
        ) : (
          <div className="text-xs text-gray-600">Instructor</div>
        )}
      </>
    )
  }

  return (
    <>
      <div className="h-16 w-40 border-b-4 mx-auto mb-3" style={{ borderColor: primaryColor }} />
      <div className="text-sm font-semibold mb-1" style={{ color: primaryColor }}>[Firma del Instructor]</div>
      <div className="text-xs text-gray-600">Instructor</div>
    </>
  )
}
