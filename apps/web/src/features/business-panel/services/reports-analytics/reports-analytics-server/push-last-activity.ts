import type { MutableUserStats } from './mutable-user-stats'

export function pushLastActivity(user: MutableUserStats, ...dates: Array<string | null | undefined>): void {
  user.lastActivityDates.push(...dates.filter((date): date is string => Boolean(date)))
}
