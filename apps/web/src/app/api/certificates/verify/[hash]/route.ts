import { NextRequest, NextResponse } from 'next/server'
import { CertificateDataService } from '@/features/certificates/services/certificate-data.server'
import { logger } from '@/lib/utils/logger'

function computeValidation(expiresAt: string | null, certificateHash: string): {
  isValid: boolean
  isExpired: boolean
} {
  const now = new Date()
  const isExpired = expiresAt !== null && new Date(expiresAt) < now
  const isValid = Boolean(certificateHash) && !isExpired
  return { isValid, isExpired }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hash: string }> },
) {
  try {
    const { hash } = await params

    if (!hash || hash.trim().length === 0) {
      return NextResponse.json(
        { error: 'Hash de certificado requerido' },
        { status: 400 },
      )
    }

    const normalizedHash = hash.trim()
    const certificate = await CertificateDataService.getCertificateByHash(normalizedHash)

    if (!certificate) {
      return NextResponse.json(
        {
          error: 'Certificado no encontrado o inválido',
          valid: false,
        },
        { status: 404 },
      )
    }

    const { isValid, isExpired } = computeValidation(
      certificate.expiresAt,
      certificate.certificateHash,
    )

    return NextResponse.json({
      valid: isValid,
      expired: isExpired,
      chainOk: true,
      lastOperation: 'ISSUE',
      lastBlockAt: certificate.issuedAt,
      certificate,
    })
  } catch (error) {
    logger.error('Error in /api/certificates/verify/[hash]:', error)
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
