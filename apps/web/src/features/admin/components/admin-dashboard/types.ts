import type {
  BookOpenIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  DocumentTextIcon,
  PlusIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'

export interface AdminDashboardThemeColors {
  accent: string
  background: string
  borderColor: string
  cardBackground: string
  inputBg: string
  inverseSubtext: string
  inverseText: string
  isLightMode: boolean
  primary: string
  secondary: string
  textPrimary: string
  textSecondary: string
}

export interface AdminDashboardProfileLike {
  display_name?: string | null
  first_name?: string | null
  last_name?: string | null
  username?: string | null
}

export interface AdminDashboardPanelStyles {
  accent_color?: string | null
  background_value?: string | null
  border_color?: string | null
  card_background?: string | null
  primary_button_color?: string | null
  secondary_button_color?: string | null
}

export interface AdminDashboardActivityUser {
  display_name?: string | null
  first_name?: string | null
  last_name?: string | null
  username?: string | null
}

export interface AdminDashboardActivityRecord {
  created_at: string
  message?: string | null
  metadata?: Record<string, unknown> | null
  notification_id: string
  notification_type?: string | null
  title?: string | null
  users?: AdminDashboardActivityUser | null
}

export interface AdminDashboardActivityItem {
  description: string
  id: string
  metadata?: Record<string, unknown> | null
  timestamp: string
  title: string
  type: 'ai-app' | 'news' | 'system' | 'user' | 'workshop'
  user: string
}

export interface AdminDashboardStatItem {
  change: number
  href: string
  iconKey: 'courses' | 'engagement' | 'organizations' | 'users'
  iconColor: string
  title: string
  value: number | string
}

export interface AdminDashboardQuickActionItem {
  color: string
  description: string
  href: string
  iconKey: 'courses' | 'documents' | 'engagement' | 'organizations' | 'users'
  title: string
}

export interface AdminDashboardStatIconMap {
  courses: typeof BookOpenIcon
  engagement: typeof ChartBarIcon
  organizations: typeof BuildingOffice2Icon
  users: typeof UsersIcon
}

export interface AdminDashboardQuickActionIconMap {
  courses: typeof PlusIcon
  documents: typeof DocumentTextIcon
  engagement: typeof ChartBarIcon
  organizations: typeof BuildingOffice2Icon
  users: typeof UsersIcon
}
