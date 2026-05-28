import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { logger } from '@/lib/utils/logger'
import { createBusinessUsersAdminClient } from '@/features/business-panel/services/business-users-server/client'
import {
  fetchBusinessUserAnalyticsDataset,
  normalizeBusinessUserAnalyticsRange,
} from '@/features/business-panel/services/business-user-analytics/business-user-analytics.server.service'
import type { BusinessUserAnalyticsResponse } from '@/features/business-panel/types/business-user-analytics.types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; userId: string }> },
) {
  try {
    const { orgSlug, userId } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return forbiddenResponse('No tienes una organizacion asignada')
    }

    const supabase = createBusinessUsersAdminClient()
    const membership = await validateOrganizationUser({
      supabase,
      organizationId: auth.organizationId,
      userId,
    })

    if (!membership.ok) {
      return forbiddenResponse('Usuario no encontrado o no pertenece a tu organizacion')
    }

    const range = normalizeBusinessUserAnalyticsRange(request.nextUrl.searchParams.get('range'))
    const dataset = await fetchBusinessUserAnalyticsDataset({
      supabase,
      userId,
      organizationId: auth.organizationId,
      range,
    })
    const { aiSamples: _aiSamples, dataHash: _dataHash, ...publicDataset } = dataset

    return NextResponse.json(publicDataset satisfies BusinessUserAnalyticsResponse, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    logger.error('Business user analytics admin GET failed', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener estadisticas del usuario' },
      { status: 500 },
    )
  }
}

async function validateOrganizationUser({
  supabase,
  organizationId,
  userId,
}: {
  supabase: ReturnType<typeof createBusinessUsersAdminClient>
  organizationId: string
  userId: string
}) {
  const { data, error } = await supabase
    .from('organization_users')
    .select('user_id')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    logger.error('Business user analytics admin membership validation failed', {
      organizationId,
      userId,
      error,
    })
  }

  return { ok: Boolean(data && !error) }
}

function forbiddenResponse(error: string): NextResponse {
  return NextResponse.json({ success: false, error }, { status: 403 })
}
