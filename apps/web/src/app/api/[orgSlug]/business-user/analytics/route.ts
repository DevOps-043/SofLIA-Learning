import { NextRequest, NextResponse } from 'next/server'
import { requireBusinessUser } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import {
  fetchBusinessUserAnalyticsDataset,
  normalizeBusinessUserAnalyticsRange,
} from '@/features/business-panel/services/business-user-analytics/business-user-analytics.server.service'
import type { BusinessUserAnalyticsResponse } from '@/features/business-panel/types/business-user-analytics.types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> },
) {
  try {
    const { orgSlug } = await params
    const auth = await requireBusinessUser({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth
    if (!auth.userId || !auth.organizationId) return forbiddenResponse()

    const range = normalizeBusinessUserAnalyticsRange(request.nextUrl.searchParams.get('range'))
    const supabase = await createClient()
    const dataset = await fetchBusinessUserAnalyticsDataset({
      supabase,
      userId: auth.userId,
      organizationId: auth.organizationId,
      range,
    })
    const { aiSamples: _aiSamples, dataHash: _dataHash, ...publicDataset } = dataset

    return NextResponse.json(publicDataset satisfies BusinessUserAnalyticsResponse, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (error) {
    logger.error('Business user analytics GET failed', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener estadisticas del usuario' },
      { status: 500 },
    )
  }
}

function forbiddenResponse(): NextResponse {
  return NextResponse.json(
    { success: false, error: 'No tienes una organizacion asignada' },
    { status: 403 },
  )
}
