import type { LucideIcon } from 'lucide-react'
import type { AdminWorkshop } from '../../services/adminWorkshops.service'
import type { AdminPanelThemeTokens } from '../../hooks/useAdminPanelTheme'

export type EditWorkshopTab = 'basic' | 'status'

export interface EditWorkshopTabItem {
  id: EditWorkshopTab
  labelKey: string
  icon: LucideIcon
}

export interface EditWorkshopStatusOption {
  value: NonNullable<AdminWorkshop['approval_status']>
  labelKey: string
  icon: LucideIcon
  color: string
}

export interface EditWorkshopFieldStyles {
  field: (hasError?: boolean) => { backgroundColor: string; borderColor: string; color: string }
  label: { color: string }
  icon: { color: string }
}

export type EditWorkshopTheme = AdminPanelThemeTokens
