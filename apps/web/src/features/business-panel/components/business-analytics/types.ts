import type { LucideIcon } from 'lucide-react'
import type {
  BusinessAnalyticsData,
  BusinessAnalyticsTeam,
  BusinessAnalyticsUser,
} from '../../types/analytics.types'

export interface BusinessAnalyticsOverviewProps {
  data: BusinessAnalyticsData
}

export interface BusinessAnalyticsUsersTableProps {
  users: BusinessAnalyticsUser[]
  onSelectUser: (user: BusinessAnalyticsUser) => void
}

export interface BusinessAnalyticsTeamsProps {
  teams: BusinessAnalyticsData['teams']
}

export interface BusinessAnalyticsUserDetailModalProps {
  user: BusinessAnalyticsUser
  onClose: () => void
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
