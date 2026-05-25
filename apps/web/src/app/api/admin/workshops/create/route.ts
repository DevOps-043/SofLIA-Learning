import { NextRequest, NextResponse } from 'next/server'

import { AdminWorkshopsService } from '@/features/admin/services/adminWorkshops.service'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'
import { SELECT_COLUMNS } from '@/lib/supabase/select-types'

import {
  createWorkshopAdminSchema,
  type CreateWorkshopAdminBody,
} from './schema'

async function handlePost(request: NextRequest, body: CreateWorkshopAdminBody) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const adminUserId = auth.userId
  const ip =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'

  try {
    const startTime = Date.now()
    const newWorkshop = await AdminWorkshopsService.createWorkshop(
      body,
      adminUserId,
      { ip, userAgent },
    )
    const duration = Date.now() - startTime

    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      const { data: translations } = await supabase
        .from('content_translations')
        .select(SELECT_COLUMNS.content_translations)
        .eq('entity_type', 'course')
        .eq('entity_id', newWorkshop.id)

      return NextResponse.json({
        success: true,
        workshop: newWorkshop,
        translationStatus: {
          executed: true,
          translationsFound: translations?.length || 0,
          duration: `${duration}ms`,
        },
      })
    } catch (verifyError) {
      logger.error(
        '[API /admin/workshops/create] Error verificando traducciones',
        verifyError,
      )
      return NextResponse.json({
        success: true,
        workshop: newWorkshop,
        translationStatus: {
          executed: true,
          verificationError:
            verifyError instanceof Error
              ? verifyError.message
              : 'Unknown error',
        },
      })
    }
  } catch (error) {
    logger.error('Error in POST /api/admin/workshops/create', error)
    return apiError(
      'CREATE_WORKSHOP_FAILED',
      'Error al crear taller',
      500,
    )
  }
}

export const POST = withZodBody(createWorkshopAdminSchema, handlePost)
