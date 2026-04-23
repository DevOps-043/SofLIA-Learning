import { applyProviderFilter } from './provider-filter'
import type { SupabaseServerClient } from './types'

export async function getTodayMetrics(
  supabase: SupabaseServerClient,
  provider: string,
) {
  const now = new Date()
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setUTCDate(yesterdayStart.getUTCDate() - 1)
  const yesterdayEnd = new Date(todayStart)
  yesterdayEnd.setUTCMilliseconds(yesterdayEnd.getUTCMilliseconds() - 1)
  const nowIso = now.toISOString()

  let todayMessagesQuery = supabase.from('lia_messages').select('cost_usd, tokens_used, model_used').gte('created_at', todayStart.toISOString()).lte('created_at', nowIso)
  let yesterdayMessagesQuery = supabase.from('lia_messages').select('cost_usd, tokens_used, model_used').gte('created_at', yesterdayStart.toISOString()).lte('created_at', yesterdayEnd.toISOString())
  todayMessagesQuery = applyProviderFilter(todayMessagesQuery, provider)
  yesterdayMessagesQuery = applyProviderFilter(yesterdayMessagesQuery, provider)

  const [
    { data: todayMessages },
    { data: yesterdayMessages },
    { data: todayConversations },
    { data: yesterdayConversations },
  ] = await Promise.all([
    todayMessagesQuery,
    yesterdayMessagesQuery,
    supabase.from('lia_conversations').select('user_id').gte('started_at', todayStart.toISOString()).lte('started_at', nowIso),
    supabase.from('lia_conversations').select('user_id').gte('started_at', yesterdayStart.toISOString()).lte('started_at', yesterdayEnd.toISOString()),
  ])

  const todayCost = (todayMessages ?? []).reduce((sum, message) => sum + (message.cost_usd || 0), 0)
  const yesterdayCost = (yesterdayMessages ?? []).reduce((sum, message) => sum + (message.cost_usd || 0), 0)
  const todayTokens = (todayMessages ?? []).reduce((sum, message) => sum + (message.tokens_used || 0), 0)
  const activeUsersToday = new Set((todayConversations ?? []).map((row) => row.user_id).filter(Boolean)).size
  const activeUsersYesterday = new Set((yesterdayConversations ?? []).map((row) => row.user_id).filter(Boolean)).size

  return {
    cost: Number(todayCost.toFixed(6)),
    tokens: todayTokens,
    messages: todayMessages?.length || 0,
    costChange: yesterdayCost > 0 ? Number((((todayCost - yesterdayCost) / yesterdayCost) * 100).toFixed(1)) : 0,
    activeUsers: activeUsersToday,
    usersChange: activeUsersYesterday > 0 ? Number((((activeUsersToday - activeUsersYesterday) / activeUsersYesterday) * 100).toFixed(1)) : 0,
  }
}
