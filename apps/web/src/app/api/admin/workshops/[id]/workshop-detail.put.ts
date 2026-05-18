import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'
import { AdminWorkshopsService } from '@/features/admin/services/adminWorkshops.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { UpdateWorkshopSchema } from '@/lib/schemas/workshop.schema'
import { z } from 'zod'
import {
  buildWorkshopAuditContext,
  type WorkshopRouteContext,
} from './workshop-detail.types'

export async function PUT(
  request: NextRequest,
  { params }: WorkshopRouteContext,
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id: workshopId } = await params
    const body = await request.json()
    const workshopData = UpdateWorkshopSchema.parse(body) as Parameters<
      typeof AdminWorkshopsService.updateWorkshop
    >[1]
    const auditContext = buildWorkshopAuditContext(request)

    const updatedWorkshop = await AdminWorkshopsService.updateWorkshop(
      workshopId,
      workshopData,
      auth.userId,
      auditContext,
    )

    return NextResponse.json({
      success: true,
      workshop: updatedWorkshop,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      techDebtLogger.error('Validation error:', error.errors)
      return NextResponse.json({
        success: false,
        message: 'Datos invÃ¡lidos',
        errors: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      }, { status: 400 })
    }

    techDebtLogger.error('Error in PUT /api/admin/workshops/[id]:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al actualizar taller',
        message: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 },
    )
  }
}
