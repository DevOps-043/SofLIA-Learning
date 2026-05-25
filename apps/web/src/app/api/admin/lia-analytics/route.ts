import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createClient } from '@/lib/supabase/server'

import { getContextDistribution } from './lia-analytics/context-distribution'
import { getCostsByPeriod } from './lia-analytics/daily-costs'
import { getDateRange, readAnalyticsRequestParams } from './lia-analytics/date-range'
import { getModelUsage } from './lia-analytics/model-usage'
import { getProjectionMetrics } from './lia-analytics/projections'
import { getSummaryMetrics } from './lia-analytics/summary-metrics'
import { getTodayMetrics } from './lia-analytics/today-metrics'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) {
      return auth
    }

    const supabase = await createClient()
    const params = readAnalyticsRequestParams(request)
    const { startDate, endDate } = getDateRange(params)
    const nowISO = new Date().toISOString()

    const summary = await getSummaryMetrics(supabase, {
      nowISO,
      provider: params.provider,
      startDate,
    })

    const [costsByPeriod, contextDistribution, today] = await Promise.all([
      getCostsByPeriod(supabase, { nowISO, provider: params.provider, startDate }),
      getContextDistribution(supabase, { nowISO, startDate }),
      getTodayMetrics(supabase, { provider: params.provider }),
    ])

    return NextResponse.json(
      {
        data: {
          contextDistribution,
          costsByPeriod,
          efficiency: summary.efficiency,
          modelUsage: getModelUsage(summary.assistantMessages),
          period: {
            end: nowISO,
            start: startDate.toISOString(),
            type: params.period,
          },
          projections: getProjectionMetrics({
            endDate,
            startDate,
            totalCostUsd: summary.summary.totalCostUsd,
          }),
          summary: summary.summary,
          today,
        },
        success: true,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Expires: '0',
          Pragma: 'no-cache',
        },
      }
    )
  } catch (error) {
    techDebtLogger.error('Error en LIA Analytics:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', success: false },
      { status: 500 }
    )
  }
}
