import type { LucideIcon } from 'lucide-react'
import type { StyleConfig } from '../../../../../features/business-panel/hooks/useOrganizationStyles'

export interface BusinessUserDashboardColors {
  primary: string
  accent: string
  onPrimary: string
  onAccent: string
  text: string
  cardBg: string
  sidebarBg: string
  border: string
  isLightMode: boolean
  textSecondary: string
  textMuted: string
  iconColor: string
  heroBg: string
  heroOverlay: string
  gridPattern: string
}

export interface BusinessUserDashboardStatItem {
  label: string
  value: number | string
  icon: LucideIcon
  color: string
  kind: 'courses' | 'inProgress' | 'completed' | 'certificates' | 'analytics'
}

export interface BusinessUserDashboardStylesProps {
  userDashboardStyles: StyleConfig | null | undefined
  resolvedTheme: string
}
