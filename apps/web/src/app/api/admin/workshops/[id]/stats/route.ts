import { NextResponse } from 'next/server'

import { AdminWorkshopAnalyticsService } from '@/features/admin/services/admin-workshops/workshop-analytics.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/logger'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const analytics = await AdminWorkshopAnalyticsService.getWorkshopAnalytics(id)

    return NextResponse.json(analytics, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'WORKSHOP_NOT_FOUND') {
      return NextResponse.json({ error: 'Taller no encontrado' }, { status: 404 })
    }

    logger.error('Error loading admin workshop analytics', error instanceof Error ? error : undefined)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
