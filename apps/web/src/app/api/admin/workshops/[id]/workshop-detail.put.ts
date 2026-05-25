import { NextRequest, NextResponse } from 'next/server'
import type { z } from 'zod'

import { AdminWorkshopsService } from '@/features/admin/services/adminWorkshops.service'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'
import { UpdateWorkshopSchema } from '@/lib/schemas/workshop.schema'

import {
  buildWorkshopAuditContext,
  type WorkshopRouteContext,
} from './workshop-detail.types'

type UpdateWorkshopBody = z.infer<typeof UpdateWorkshopSchema>

async function handlePut(
  request: NextRequest,
  body: UpdateWorkshopBody,
  context: WorkshopRouteContext,
) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  try {
    const { id: workshopId } = await context.params
    const workshopData = body as Parameters<
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
    logger.error('Error in PUT /api/admin/workshops/[id]', error)
    return apiError(
      'UPDATE_WORKSHOP_FAILED',
      'Error al actualizar taller',
      500,
    )
  }
}

export const PUT = withZodBody(UpdateWorkshopSchema, handlePut)
