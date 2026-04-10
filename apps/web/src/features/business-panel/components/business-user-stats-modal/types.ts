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
  cardBg: string
  textColor: string
  mutedTextColor: string
  primaryColor: string
  accentColor: string
  secondaryColor: string
  onPrimaryColor: string
  chartColors: string[]
  successColor: string
  warningColor: string
}

export type BusinessUserStatsTranslateOptions =
  | string
  | ({ count?: number } & Record<string, unknown>)

export type BusinessUserStatsTranslate = (
  key: string,
  options?: BusinessUserStatsTranslateOptions,
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
