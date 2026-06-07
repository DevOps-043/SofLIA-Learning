import { getActiveUsersChange } from './today-active-users'
import {
  resolveLiaMessageCost,
  resolveLiaMessageTokens,
} from './message-metrics'
import { fetchMessagesForRange } from './today-message-ranges'
import { getTodayComparisonRange } from './today-ranges'
import type { LiaAnalyticsSupabaseClient } from './types'

export async function getTodayMetrics(
  supabase: LiaAnalyticsSupabaseClient,
  input: { provider: string }
) {
  const { todayStart, yesterdayEnd, yesterdayStart } = getTodayComparisonRange()
  const nowForToday = new Date().toISOString()

  const [todayMessages, yesterdayMessages, activeUsers] = await Promise.all([
    fetchMessagesForRange(supabase, input.provider, todayStart, nowForToday),
    fetchMessagesForRange(
      supabase,
      input.provider,
      yesterdayStart,
      yesterdayEnd.toISOString()
    ),
    getActiveUsersChange(supabase, {
      nowForToday,
      todayStart,
      yesterdayEnd,
      yesterdayStart,
    }),
  ])

  const todayCost = todayMessages.reduce(
    (sum, item) => sum + resolveLiaMessageCost(item),
    0
  )
  const yesterdayCost = yesterdayMessages.reduce(
    (sum, item) => sum + resolveLiaMessageCost(item),
    0
  )

  return {
    activeUsers: activeUsers.activeUsersToday,
    cost: Number(todayCost.toFixed(6)),
    costChange:
      yesterdayCost > 0
        ? Number((((todayCost - yesterdayCost) / yesterdayCost) * 100).toFixed(1))
        : 0,
    messages: todayMessages.length,
    tokens: todayMessages.reduce(
      (sum, item) => sum + resolveLiaMessageTokens(item),
      0
    ),
    usersChange: activeUsers.usersChange,
  }
}
