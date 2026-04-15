import { NextResponse } from 'next/server'
import { SessionService } from '@/features/auth/services/session.service'
import { CertificateDataService } from '@/features/certificates/services/certificate-data.server'
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

    return NextResponse.json({
      success: true,
      certificate,
    })
  } catch (error) {
    logger.error('Error in /api/certificates/[id]:', error)
    return NextResponse.json(
      {
        error: 'Error al obtener el certificado',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 },
    )
  }
}
