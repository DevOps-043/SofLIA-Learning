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

export async function PATCH(request: NextRequest) {
  try {
    // ✅ SEGURIDAD: Verificar autenticación y autorización de admin
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    logger.log('🔄 Actualizando reporte...')

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID del reporte es requerido' },
        { status: 400 }
      )
    }

    // Validar que solo se actualicen campos permitidos
    const allowedFields = ['estado', 'admin_asignado', 'notas_admin', 'prioridad']
    const updateData: Record<string, unknown> = {}
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field]
      }
    }

    // Si se asigna admin, usar el ID del admin autenticado si no se especifica
    if (updateData.admin_asignado === undefined && updates.estado) {
      // Si se cambia el estado y no hay admin asignado, asignar al admin actual
      if (['en_revision', 'en_progreso'].includes(updates.estado)) {
        updateData.admin_asignado = auth.userId
      }
    }

    const updatedReporte = await AdminReportesService.updateReporte(id, updateData)

    logger.log('✅ Reporte actualizado exitosamente:', updatedReporte.id)
    return NextResponse.json({
      success: true,
      reporte: updatedReporte
    })
  } catch (error) {
    logError('PATCH /api/admin/reportes', error)
    return NextResponse.json(
      formatApiError(error, 'Error al actualizar reporte'),
      { status: 500 }
    )
  }
}
