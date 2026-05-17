import { NextRequest, NextResponse } from 'next/server'
import { AdminWorkshopsService } from '@/features/admin/services/adminWorkshops.service'
import { WorkshopDeletionError } from '@/features/admin/services/admin-workshops/workshop-deletion.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import {
  buildWorkshopAuditContext,
  type WorkshopRouteContext,
} from './workshop-detail.types'

export async function DELETE(
  request: NextRequest,
  { params }: WorkshopRouteContext,
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id: workshopId } = await params
    const auditContext = buildWorkshopAuditContext(request)

    await AdminWorkshopsService.deleteWorkshop(
      workshopId,
      auth.userId,
      auditContext,
    )

    return NextResponse.json({
      success: true,
      message: 'Taller eliminado correctamente',
    })
  } catch (error) {
    if (error instanceof WorkshopDeletionError) {
      console.error('Error controlado al eliminar taller:', error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: error.statusCode },
      )
    }

    console.error('Error inesperado en DELETE /api/admin/workshops/[id]:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al eliminar taller',
        message: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 },
    )
  }
}
