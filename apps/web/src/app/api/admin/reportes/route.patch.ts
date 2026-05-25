import { NextRequest, NextResponse } from 'next/server'

import { AdminReportesService } from '@/features/admin/services/adminReportes.service'
import { formatApiError, logError } from '@/core/utils/api-errors'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { requireAdmin } from '@/lib/auth/requireAdmin'

import { updateReporteSchema, type UpdateReporteBody } from './schema'

async function handlePatch(_request: NextRequest, body: UpdateReporteBody) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const { id, ...updates } = body
  const updateData: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      updateData[key] = value
    }
  }

  if (
    updateData.admin_asignado === undefined &&
    updates.estado &&
    ['en_revision', 'en_progreso'].includes(updates.estado)
  ) {
    updateData.admin_asignado = auth.userId
  }

  try {
    const updatedReporte = await AdminReportesService.updateReporte(id, updateData)
    return NextResponse.json({ success: true, reporte: updatedReporte })
  } catch (error) {
    logError('PATCH /api/admin/reportes', error)
    const formatted = formatApiError(error, 'Error al actualizar reporte') as {
      error?: string
      message?: string
    }
    return apiError(
      'UPDATE_REPORTE_FAILED',
      formatted.message || formatted.error || 'Error al actualizar reporte',
      500,
    )
  }
}

export const PATCH = withZodBody(updateReporteSchema, handlePatch)
