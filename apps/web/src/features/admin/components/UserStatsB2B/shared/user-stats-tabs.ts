import { Activity, BarChart3, BookOpen, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { UserStatsTab } from '../types'

export interface UserStatsTabOption {
  id: UserStatsTab
  labelKey: string
  icon: LucideIcon
}

export const USER_STATS_TABS: UserStatsTabOption[] = [
  { id: 'overview', labelKey: 'userStats.tabs.overview', icon: BarChart3 },
  { id: 'learning', labelKey: 'userStats.tabs.learning', icon: BookOpen },
  { id: 'engagement', labelKey: 'userStats.tabs.engagement', icon: Activity },
  { id: 'users', labelKey: 'userStats.tabs.users', icon: Users },
]
