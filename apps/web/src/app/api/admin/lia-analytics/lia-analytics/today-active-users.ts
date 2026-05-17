import type { LiaAnalyticsSupabaseClient } from './types'

export async function getActiveUsersChange(
  supabase: LiaAnalyticsSupabaseClient,
  input: {
    nowForToday: string
    todayStart: Date
    yesterdayEnd: Date
    yesterdayStart: Date
  }
) {
  const [todayConversations, yesterdayConversations] = await Promise.all([
    getConversationUserIds(supabase, input.todayStart, input.nowForToday),
    getConversationUserIds(
      supabase,
      input.yesterdayStart,
      input.yesterdayEnd.toISOString()
    ),
  ])

  const activeUsersToday = new Set(todayConversations).size
  const activeUsersYesterday = new Set(yesterdayConversations).size

  return {
    activeUsersToday,
    usersChange:
      activeUsersYesterday > 0
        ? Number(
            (((activeUsersToday - activeUsersYesterday) / activeUsersYesterday) * 100).toFixed(1)
          )
        : 0,
  }
}

async function getConversationUserIds(
  supabase: LiaAnalyticsSupabaseClient,
  start: Date,
  endISO: string
): Promise<string[]> {
  const { data } = await supabase
    .from('lia_conversations')
    .select('user_id')
    .gte('started_at', start.toISOString())
    .lte('started_at', endISO)

  return data?.map((conversation) => conversation.user_id).filter(Boolean) || []
}
