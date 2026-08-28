import { NextResponse } from 'next/server'
import { SessionService } from '@/features/auth/services/session.service'
import { CertificateDataService } from '@/features/certificates/services/certificate-data.server'
import { CertificatePdfService } from '@/features/certificates/services/certificate-pdf.server'
import { logger } from '@/lib/utils/logger'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await SessionService.getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'ID de certificado requerido' }, { status: 400 })
    }

    const certificate = await CertificateDataService.getUserCertificateById(currentUser.id, id)

    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificado no encontrado o no autorizado' },
        { status: 404 },
      )
    }

    const ensuredPdf = await CertificatePdfService.ensureStoredPdf({
      userId: currentUser.id,
      certificateId: certificate.certificateId,
      cookieHeader: request.headers.get('cookie'),
    })

    return new NextResponse(ensuredPdf.buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${certificate.documentModel.fileName}"`,
        'Content-Length': ensuredPdf.buffer.length.toString(),
      },
    })
  } catch (error) {
    logger.error('Error in /api/certificates/[id]/download:', error)
    return NextResponse.json(
      { error: 'Error al descargar certificado' },
      { status: 500 },
    )
  }
}
