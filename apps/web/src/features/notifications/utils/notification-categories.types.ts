import type { LucideIcon } from 'lucide-react'

export type NotificationCategory =
  | 'system'
  | 'community'
  | 'course'
  | 'news'
  | 'reel'
  | 'prompt'
  | 'critical'
  | 'org'
  | 'planner'

export type NotificationPriority = 'critical' | 'high' | 'medium' | 'low'

export interface NotificationCategoryConfig {
  category: NotificationCategory
  color: string
  bgColor: string
  borderColor: string
  icon: LucideIcon
  priority: NotificationPriority
}
