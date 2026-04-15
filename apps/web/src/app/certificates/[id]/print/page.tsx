import { notFound } from 'next/navigation'
import { SessionService } from '@/features/auth/services/session.service'
import { CertificateDocument } from '@/features/certificates/components/CertificateDocument'
import { CertificateDataService } from '@/features/certificates/services/certificate-data.server'
import {
  CERTIFICATE_RENDER_HEIGHT_PX,
  CERTIFICATE_RENDER_WIDTH_PX,
} from '@/features/certificates/constants/certificate-branding'

export const dynamic = 'force-dynamic'

export default async function CertificatePrintPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const currentUser = await SessionService.getCurrentUser()

  if (!currentUser) {
    notFound()
  }

  const { id } = await params
  const certificate = await CertificateDataService.getUserCertificateById(currentUser.id, id)

  if (!certificate) {
    notFound()
  }

  return (
    <div
      data-certificate-print-ready="true"
      className="min-h-screen bg-white"
      style={{
        width: '297mm',
        height: '210mm',
        margin: 0,
        padding: 0,
      }}
    >
      <style>{`
        @page {
          size: A4 landscape;
          margin: 0;
        }

        html, body {
          margin: 0;
          padding: 0;
          background: #ffffff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      `}</style>

      <div
        style={{
          width: `${CERTIFICATE_RENDER_WIDTH_PX}px`,
          height: `${CERTIFICATE_RENDER_HEIGHT_PX}px`,
          margin: '0 auto',
        }}
      >
        <CertificateDocument model={certificate.documentModel} />
      </div>
    </div>
  )
}
