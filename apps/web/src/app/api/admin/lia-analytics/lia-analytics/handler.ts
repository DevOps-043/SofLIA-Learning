import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createClient } from '@/lib/supabase/server'
import { getContextDistribution } from './context-distribution'
import { getCostsByPeriod } from './daily-costs'
import { resolveAnalyticsRange } from './date-range'
import { getModelUsage } from './model-usage'
import { getSummaryMetrics } from './summary-metrics'
import { getTodayMetrics } from './today-metrics'

export async function handleLiaAnalyticsRequest(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const supabase = await createClient()
    const searchParams = new URL(request.url).searchParams
    const provider = searchParams.get('provider') || 'openai'
    const { period, startDate, endDate } = resolveAnalyticsRange(searchParams)
    const nowIso = new Date().toISOString()
    const startIso = startDate.toISOString()

    const [summary, costsByPeriod, contextDistribution, today] = await Promise.all([
      getSummaryMetrics(supabase, startIso, nowIso, provider),
      getCostsByPeriod(supabase, startDate, nowIso, provider),
      getContextDistribution(supabase, startIso, nowIso),
      getTodayMetrics(supabase, provider),
    ])

    const daysInPeriod = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const avgDailyCost = daysInPeriod > 0 ? summary.totalCostUsd / daysInPeriod : 0
    const avgMessagesPerConversation = summary.totalConversations > 0
      ? Number((summary.totalMessages / summary.totalConversations).toFixed(1))
      : 0
    const avgCostPerMessage = summary.totalMessages > 0
      ? Number((summary.totalCostUsd / summary.totalMessages).toFixed(6))
      : 0

    return NextResponse.json({
      success: true,
      data: {
        period: { start: startIso, end: nowIso, type: period },
        summary: {
          totalConversations: summary.totalConversations,
          totalMessages: summary.totalMessages,
          totalTokens: summary.totalTokens,
          totalCostUsd: Number(summary.totalCostUsd.toFixed(6)),
          avgResponseTimeMs: summary.avgResponseTimeMs,
          completedActivities: summary.completedActivities,
        },
        today,
        efficiency: { avgMessagesPerConversation, avgCostPerMessage },
        projections: {
          dailyAvg: Number(avgDailyCost.toFixed(6)),
          monthlyEstimate: Number((avgDailyCost * 30).toFixed(4)),
        },
        costsByPeriod,
        contextDistribution,
        modelUsage: getModelUsage(summary.assistantMessages),
      },
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    })
  } catch (error) {
    console.error('Error en LIA Analytics:', error)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
