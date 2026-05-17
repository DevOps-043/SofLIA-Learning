import type { BusinessUserAnalyticsInsights } from '../../../types/business-user-analytics.types'
import { getCachedInsights, storeCachedInsights } from './cache'
import { generateBusinessUserAnalyticsInsights } from './generate'
import type { GetBusinessUserAnalyticsInsightsParams } from './types'

export async function getBusinessUserAnalyticsInsights({
  supabase,
  userId,
  organizationId,
  range,
  locale,
  dataset,
}: GetBusinessUserAnalyticsInsightsParams): Promise<BusinessUserAnalyticsInsights> {
  const cacheInput = {
    supabase,
    userId,
    organizationId,
    range,
    locale,
    dataHash: dataset.dataHash,
  }
  const cached = await getCachedInsights(cacheInput)

  if (cached) return cached

  const insights = await generateBusinessUserAnalyticsInsights({ dataset, locale })
  if (insights.unavailable) return insights

  await storeCachedInsights({ ...cacheInput, insights })
  return insights
}
