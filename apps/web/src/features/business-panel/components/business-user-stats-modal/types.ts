import type { LucideIcon } from 'lucide-react'
import type { BusinessUser } from '../../services/businessUsers.service'
import type {
  BusinessUserStatsData,
  BusinessUserStatsTabId,
} from '../../types/business-user-stats.types'

export interface BusinessUserStatsTheme {
  isDark: boolean
  modalBg: string
  modalBorder: string
  textColor: string
  primaryColor: string
  accentColor: string
  secondaryColor: string
}

export type BusinessUserStatsTranslate = (
  key: string,
  options?: { count?: number } & Record<string, unknown>,
) => string

export interface BusinessUserStatsHeaderTab {
  id: BusinessUserStatsTabId
  label: string
  icon: LucideIcon
}

export interface BusinessUserStatsSidebarProps {
  user: BusinessUser
  displayName: string
  initials: string
  t: BusinessUserStatsTranslate
  theme: BusinessUserStatsTheme
  formatDate: (dateString: string | null | undefined) => string
  formatRelativeTime: (dateString: string | null | undefined) => string
}

export interface BusinessUserStatsHeaderProps {
  activeTab: BusinessUserStatsTabId
  onChangeTab: (tab: BusinessUserStatsTabId) => void
  onClose: () => void
  tabs: BusinessUserStatsHeaderTab[]
  theme: BusinessUserStatsTheme
}

export interface BusinessUserStatsTabProps {
  stats: BusinessUserStatsData
  t: BusinessUserStatsTranslate
  theme: BusinessUserStatsTheme
  formatDate: (dateString: string | null | undefined) => string
  formatMonth: (monthKey: string) => string
}
