import { filterAdminWorkshops, getAdminWorkshopLevelKey } from './admin-workshops-filter.service'
import { ADMIN_WORKSHOP_CATEGORY_OPTIONS, ADMIN_WORKSHOP_STATUS_OPTIONS } from './admin-workshops-options'
import { deleteAdminWorkshop, updateAdminWorkshop } from './admin-workshops-api'
import { formatWorkshopDuration, getWorkshopInstructorInitials } from './admin-workshops-formatters'
import { getAdminWorkshopCategoryConfig, getAdminWorkshopLevelConfig, getAdminWorkshopStatusConfig } from './admin-workshops-badges'

export interface AdminWorkshopDisplayTheme {
  primaryColor: string
  successColor: string
  warningColor: string
  dangerColor: string
  secondaryColor: string
  mutedTextColor: string
  textColor: string
  inputBg: string
  borderColor: string
}

export interface AdminWorkshopBadgeConfig {
  labelKey?: string
  fallbackLabel: string
  color: string
  bg: string
  border: string
}

export {
  ADMIN_WORKSHOP_CATEGORY_OPTIONS,
  ADMIN_WORKSHOP_STATUS_OPTIONS,
  deleteAdminWorkshop,
  filterAdminWorkshops,
  formatWorkshopDuration,
  getAdminWorkshopCategoryConfig,
  getAdminWorkshopLevelConfig,
  getAdminWorkshopLevelKey,
  getAdminWorkshopStatusConfig,
  getWorkshopInstructorInitials,
  updateAdminWorkshop,
}
