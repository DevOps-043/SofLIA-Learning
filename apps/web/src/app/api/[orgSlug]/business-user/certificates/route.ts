import { NextRequest, NextResponse } from 'next/server'
import { requireBusinessUser } from '@/lib/auth/requireBusiness'
import { CertificateDataService } from '@/features/certificates/services/certificate-data.server'
import { logger } from '@/lib/utils/logger'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> },
) {
  try {
    const { orgSlug } = await params
    const auth = await requireBusinessUser({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth
    if (!auth.userId || !auth.organizationId) {
      return NextResponse.json({ error: 'No tienes una organización asignada' }, { status: 403 })
    }

    const certificates = await CertificateDataService.listUserCertificates(auth.userId, {
      organizationId: auth.organizationId,
    })

    return NextResponse.json({
      success: true,
      certificates,
      count: certificates.length,
    })
  } catch (error) {
    logger.error('Error in /api/[orgSlug]/business-user/certificates:', error)
    return NextResponse.json(
      { error: 'Error al obtener certificados' },
      { status: 500 },
    )
  }
}
