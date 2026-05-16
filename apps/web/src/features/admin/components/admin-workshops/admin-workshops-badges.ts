import type { AdminWorkshopBadgeConfig, AdminWorkshopDisplayTheme } from './admin-workshops-display.service'
import { getAdminWorkshopLevelKey } from './admin-workshops-filter.service'

export function getAdminWorkshopLevelConfig(
  level: string,
  theme: AdminWorkshopDisplayTheme,
): AdminWorkshopBadgeConfig {
  const levelKey = getAdminWorkshopLevelKey(level)
  switch (levelKey) {
    case 'beginner':
      return { labelKey: 'workshops.card.level.beginner', fallbackLabel: 'Principiante', color: theme.successColor, bg: `${theme.successColor}14`, border: `${theme.successColor}26` }
    case 'intermediate':
      return { labelKey: 'workshops.card.level.intermediate', fallbackLabel: 'Intermedio', color: theme.warningColor, bg: `${theme.warningColor}14`, border: `${theme.warningColor}26` }
    case 'advanced':
      return { labelKey: 'workshops.card.level.advanced', fallbackLabel: 'Avanzado', color: theme.dangerColor, bg: `${theme.dangerColor}14`, border: `${theme.dangerColor}26` }
    default:
      return { fallbackLabel: level, color: theme.mutedTextColor, bg: theme.inputBg, border: theme.borderColor }
  }
}

export function getAdminWorkshopCategoryConfig(
  category: string,
  theme: AdminWorkshopDisplayTheme,
): AdminWorkshopBadgeConfig {
  switch (category) {
    case 'ia':
    case 'Inteligencia Artificial':
      return { fallbackLabel: category, color: theme.primaryColor, bg: `${theme.primaryColor}14`, border: `${theme.primaryColor}26` }
    case 'tecnologia':
    case 'Frontend':
    case 'frontend':
    case 'Backend':
    case 'backend':
      return { fallbackLabel: category, color: theme.secondaryColor, bg: `${theme.secondaryColor}14`, border: `${theme.secondaryColor}26` }
    case 'negocios':
      return { fallbackLabel: category, color: theme.successColor, bg: `${theme.successColor}14`, border: `${theme.successColor}26` }
    case 'diseno':
    case 'Diseno':
    case 'design':
      return { fallbackLabel: category, color: theme.warningColor, bg: `${theme.warningColor}14`, border: `${theme.warningColor}26` }
    default:
      return { fallbackLabel: category, color: theme.mutedTextColor, bg: theme.inputBg, border: theme.borderColor }
  }
}

export function getAdminWorkshopStatusConfig(
  isActive: boolean,
  theme: AdminWorkshopDisplayTheme,
): AdminWorkshopBadgeConfig {
  return isActive
    ? { labelKey: 'workshops.card.statusActive', fallbackLabel: 'Activo', color: theme.successColor, bg: `${theme.successColor}14`, border: `${theme.successColor}26` }
    : { labelKey: 'workshops.card.statusInactive', fallbackLabel: 'Inactivo', color: theme.mutedTextColor, bg: theme.inputBg, border: theme.borderColor }
}
