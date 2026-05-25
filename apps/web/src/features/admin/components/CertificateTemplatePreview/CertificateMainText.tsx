import type { CertificatePreviewData } from './types'

interface CertificateMainTextProps {
  accentColor: string
  data: CertificatePreviewData
  primaryColor: string
  secondaryColor: string
}

export function CertificateMainText({
  accentColor,
  data,
  primaryColor,
  secondaryColor,
}: CertificateMainTextProps) {
  return (
    <>
      <div className="w-64 h-1 mb-10 mx-auto" style={{ background: `linear-gradient(to right, transparent, ${accentColor}, transparent)` }} />
      <div className="text-lg mb-6 text-gray-700 max-w-3xl font-medium leading-relaxed px-8">El presente certifica que</div>
      <div className="text-4xl font-bold mb-6 px-6 py-3 border-4 rounded-lg" style={{ color: secondaryColor, borderColor: primaryColor, backgroundColor: 'rgba(30, 58, 138, 0.05)' }}>
        {data.studentName}
      </div>
      <div className="text-lg mb-6 text-gray-700 max-w-3xl font-medium leading-relaxed px-8">ha completado exitosamente el curso</div>
      <div className="text-2xl font-semibold mb-12 px-6 py-3 border-2 rounded" style={{ color: primaryColor, borderColor: secondaryColor, backgroundColor: 'rgba(96, 165, 250, 0.1)' }}>
        {data.courseName}
      </div>
    </>
  )
}
