import 'server-only'

import type { BusinessUserAnalyticsSupabaseClient } from './core/business-user-analytics-supabase-client'
import { getOrCreateDailyAiReport } from '@/features/business-panel/services/daily-ai-report'
import type { DailyAiReportDocument } from '@/features/business-panel/services/daily-ai-report/daily-ai-report.types'
import type {
  BusinessUserAnalyticsLocale,
  BusinessUserAnalyticsRange,
  BusinessUserAnalyticsResponse,
} from '@/features/business-panel/types/business-user-analytics.types'
import { logger } from '@/lib/utils/logger'

import { getBusinessUserAnalyticsInsights } from './business-user-analytics.insights.service'
import { fetchBusinessUserAnalyticsDataset } from './business-user-analytics.server.service'
import { renderUserStatsPdf } from './pdf/render-user-stats-pdf.server'

interface UserStatsDailyReportParams {
  // El cliente admin ya viene resuelto por la ruta, que es quien valida permisos.
  supabase: BusinessUserAnalyticsSupabaseClient
  userId: string
  organizationId: string
  range: BusinessUserAnalyticsRange
  locale: BusinessUserAnalyticsLocale
  /** Quién pide la descarga: puede ser el propio usuario o un admin de la organización. */
  requestedByUserId?: string | null
}

/**
 * PDF de estadísticas de un usuario, uno por día natural.
 *
 * La primera descarga del día consulta datos, pide el análisis a SofLIA y guarda
 * el archivo; el resto del día se devuelve ese mismo documento. El rango forma
 * parte del ámbito, así que "últimos 30 días" y "últimos 90" son informes
 * distintos y cada uno se genera una vez.
 */
export async function getUserStatsDailyReport(
  params: UserStatsDailyReportParams,
): Promise<DailyAiReportDocument> {
  const { supabase, userId, organizationId, range, locale, requestedByUserId } = params

  return getOrCreateDailyAiReport({
    reportType: 'user_stats',
    organizationId,
    subjectUserId: userId,
    locale,
    scopeKey: `range=${range}`,
    generatedByUserId: requestedByUserId ?? userId,
    generate: async () => {
      const dataset = await fetchBusinessUserAnalyticsDataset({
        supabase,
        userId,
        organizationId,
        range,
      })
      const insights = await getBusinessUserAnalyticsInsights({
        supabase,
        userId,
        organizationId,
        range,
        locale,
        dataset,
      })

      // El documento consume la misma forma que recibe el panel, sin los campos
      // internos que alimentan al modelo.
      const { aiSamples: _aiSamples, dataHash: _dataHash, ...response } = dataset
      const labels = await resolveReportLabels({ supabase, userId, organizationId })
      const bytes = await renderUserStatsPdf(response satisfies BusinessUserAnalyticsResponse, {
        userLabel: labels.userLabel,
        organizationLabel: labels.organizationLabel,
        locale,
        insights,
      })

      return {
        bytes,
        fileName: buildUserStatsFileName(labels.userLabel, range),
        modelName: insights.model,
      }
    },
  })
}

interface ReportLabels {
  userLabel: string
  organizationLabel: string | null
}

async function resolveReportLabels({
  supabase,
  userId,
  organizationId,
}: {
  supabase: BusinessUserAnalyticsSupabaseClient
  userId: string
  organizationId: string
}): Promise<ReportLabels> {
  const [userResult, organizationResult] = await Promise.all([
    supabase
      .from('users')
      .select('display_name, first_name, last_name, username')
      .eq('id', userId)
      .maybeSingle(),
    supabase.from('organizations').select('name').eq('id', organizationId).maybeSingle(),
  ])

  if (userResult.error) {
    logger.error('User stats report label lookup failed', userResult.error)
  }

  const user = userResult.data as {
    display_name?: string | null
    first_name?: string | null
    last_name?: string | null
    username?: string | null
  } | null
  const organization = organizationResult.data as { name?: string | null } | null

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim()

  return {
    userLabel: user?.display_name || fullName || user?.username || 'Usuario',
    organizationLabel: organization?.name ?? null,
  }
}

function buildUserStatsFileName(userLabel: string, range: BusinessUserAnalyticsRange): string {
  const slug = userLabel
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `estadisticas-${slug || 'usuario'}-${range}.pdf`
}
