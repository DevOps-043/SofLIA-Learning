import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import type { BusinessUserAnalyticsInsights } from '../../../types/business-user-analytics.types'
import { isInsightsPayload, toJson } from './json'
import type { CacheInsert, CacheInsightsInput, CacheRow, StoreInsightsInput } from './types'

const CACHE_TABLE = 'business_user_analytics_insight_cache'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

export async function getCachedInsights(
  input: CacheInsightsInput,
): Promise<BusinessUserAnalyticsInsights | null> {
  const cacheTable = fromLoose<CacheRow, CacheInsert>(input.supabase, CACHE_TABLE)
  const { data, error } = await cacheTable
    .select('id, user_id, organization_id, range, locale, data_hash, model_name, payload, created_at, expires_at')
    .eq('user_id', input.userId)
    .eq('organization_id', input.organizationId)
    .eq('range', input.range)
    .eq('locale', input.locale)
    .eq('data_hash', input.dataHash)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    logger.error('Business user analytics insight cache read failed', error)
    return null
  }

  if (!data || !isInsightsPayload(data.payload)) return null

  const payload = data.payload as BusinessUserAnalyticsInsights

  return {
    ...payload,
    cached: true,
    expiresAt: data.expires_at,
  }
}

export async function storeCachedInsights(input: StoreInsightsInput): Promise<void> {
  const expiresAt = new Date(Date.now() + CACHE_TTL_MS).toISOString()
  const cacheTable = fromLoose<CacheRow, CacheInsert>(input.supabase, CACHE_TABLE)
  const { error } = await cacheTable.insert({
    user_id: input.userId,
    organization_id: input.organizationId,
    range: input.range,
    locale: input.locale,
    data_hash: input.dataHash,
    model_name: input.insights.model,
    payload: toJson({
      ...input.insights,
      cached: false,
      expiresAt,
    }),
    expires_at: expiresAt,
  })

  if (error) {
    logger.error('Business user analytics insight cache write failed', error)
  }
}
