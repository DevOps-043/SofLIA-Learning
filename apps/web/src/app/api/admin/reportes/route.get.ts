import { NextRequest, NextResponse } from 'next/server'

import { logger } from '@/lib/utils/logger'

import { AdminReportesService } from '@/features/admin/services/adminReportes.service'

import { formatApiError, logError } from '@/core/utils/api-errors'

import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET(request: NextRequest) {
  try {
    // ✅ SEGURIDAD: Verificar autenticación y autorización de admin
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    logger.log('🔄 Cargando reportes desde API...')

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado') || undefined
    const categoria = searchParams.get('categoria') || undefined
    const prioridad = searchParams.get('prioridad') || undefined
    const search = searchParams.get('search') || undefined

    const filters = {
      estado,
      categoria,
      prioridad,
      search
    }

    const [reportes, stats] = await Promise.all([
      AdminReportesService.getReportes(filters),
      AdminReportesService.getReporteStats()
    ])

    logger.log('✅ Reportes cargados:', reportes?.length || 0)

    return NextResponse.json({
      success: true,
      reportes: reportes || [],
      stats: stats || {}
    })
  } catch (error) {
    logError('GET /api/admin/reportes', error)
    return NextResponse.json(
      {
        ...formatApiError(error, 'Error al obtener reportes'),
        reportes: [],
        stats: {}
      },
      { status: 500 }
    )
  }
}
