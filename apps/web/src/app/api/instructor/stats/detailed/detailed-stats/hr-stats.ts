import { getDayKey } from './date-range'
import { incrementCounter, mapCountryCode } from './map-utils'
import { getDemographics } from './hr-demographics'
import type { CountMap, SupabaseServerClient } from './shared-types'

export async function getHrStats(
  supabase: SupabaseServerClient,
  courseIds: string[],
  communityIds: string[],
  startDate: Date,
  endDate: Date,
) {
  const startIso = startDate.toISOString()
  const endIso = endDate.toISOString()
  const enrollmentsTask = courseIds.length
    ? supabase.from('user_course_enrollments').select('user_id').in('course_id', courseIds).gte('enrolled_at', startIso).lte('enrolled_at', endIso)
    : Promise.resolve({ data: [] as Array<{ user_id: string }> })
  const membersTask = communityIds.length
    ? supabase.from('community_members').select('user_id').in('community_id', communityIds).gte('joined_at', startIso).lte('joined_at', endIso)
    : Promise.resolve({ data: [] as Array<{ user_id: string }> })
  const [{ data: enrollments }, { data: members }] = await Promise.all([enrollmentsTask, membersTask])
  const userIds = [...new Set([...(enrollments ?? []).map((row) => row.user_id), ...(members ?? []).map((row) => row.user_id)])]
  const usersByCountry: CountMap = {}
  const registrationsByDate: CountMap = {}

  if (userIds.length) {
    const { data: users } = await supabase.from('users').select('country_code, created_at').in('id', userIds)
    ;(users ?? []).forEach((user) => {
      if (user.country_code) incrementCounter(usersByCountry, mapCountryCode(user.country_code))
      if (!user.created_at) return
      const createdAt = new Date(user.created_at)
      if (createdAt >= startDate && createdAt <= endDate) {
        incrementCounter(registrationsByDate, getDayKey(createdAt))
      }
    })
  }

  return {
    usersByCountry: Object.entries(usersByCountry).map(([country, count]) => ({ country, count })),
    registrationsByDate: Object.entries(registrationsByDate).map(([date, count]) => ({ date, count })),
    demographics: await getDemographics(supabase, userIds),
  }
}
