import { NextRequest, NextResponse } from 'next/server'
import { SessionService } from '@/features/auth/services/session.service'
import { CertificateDataService } from '@/features/certificates/services/certificate-data.server'
import { logger } from '@/lib/utils/logger'

export async function GET(request: NextRequest) {
  try {
    const currentUser = await SessionService.getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const certificates = await CertificateDataService.listUserCertificates(currentUser.id)

    return NextResponse.json({
      success: true,
      certificates,
      count: certificates.length,
    })
  } catch (error) {
    logger.error('Error in /api/certificates:', error)
    return NextResponse.json(
      {
        error: 'Error al obtener certificados',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 },
    )
  }
}
