import type { LucideIcon } from 'lucide-react'
import type {
  BusinessAnalyticsData,
  BusinessAnalyticsTeam,
  BusinessAnalyticsUser,
} from '../../types/analytics.types'

export interface BusinessAnalyticsThemeTokens {
  cardBg?: string
  cardBorder?: string
  textColor?: string
  accentColor: string
  secondaryColor?: string
}

export interface BusinessAnalyticsOverviewProps {
  data: BusinessAnalyticsData
  accentColor: string
}

export interface BusinessAnalyticsUsersTableProps {
  users: BusinessAnalyticsUser[]
  onSelectUser: (user: BusinessAnalyticsUser) => void
}

export interface BusinessAnalyticsTeamsProps {
  teams: BusinessAnalyticsData['teams']
  accentColor: string
  secondaryColor: string
}

export interface BusinessAnalyticsUserDetailModalProps {
  user: BusinessAnalyticsUser
  onClose: () => void
  theme: BusinessAnalyticsThemeTokens
}

export interface BusinessAnalyticsTabButtonProps {
  isActive: boolean
  onClick: () => void
  label: string
  icon: LucideIcon
}

export interface BusinessAnalyticsMetricCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  color: string
}

export interface BusinessAnalyticsUserAvatarProps {
  imageUrl: string | null
  alt: string
  initials: string
  size: 'sm' | 'lg'
  borderColor?: string
}

export type BusinessAnalyticsTeamItem = BusinessAnalyticsTeam
