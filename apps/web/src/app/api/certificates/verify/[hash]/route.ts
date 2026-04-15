import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CertificateDataService } from '@/features/certificates/services/certificate-data.server'
import { logger } from '@/lib/utils/logger'

interface ValidationRow {
  certificate_id: string
  chain_ok: boolean
  course_title: string
  is_expired: boolean
  is_valid: boolean
  issued_at: string
  last_block_at: string
  last_op: string
  user_id: string
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
    const supabase = createAdminClient()

    const { data, error } = await supabase.rpc('validate_certificate', {
      p_hash: normalizedHash,
    })

    if (error) {
      logger.error('Error validating certificate via RPC:', error)
      return NextResponse.json(
        {
          error: 'Error al validar el certificado',
          details: error.message,
        },
        { status: 500 },
      )
    }

    const validation = ((data || []) as ValidationRow[])[0]

    if (!validation) {
      return NextResponse.json(
        {
          error: 'Certificado no encontrado o inválido',
          valid: false,
        },
        { status: 404 },
      )
    }

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

    return NextResponse.json({
      valid: validation.is_valid,
      expired: validation.is_expired,
      chainOk: validation.chain_ok,
      lastOperation: validation.last_op || null,
      lastBlockAt: validation.last_block_at || null,
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
