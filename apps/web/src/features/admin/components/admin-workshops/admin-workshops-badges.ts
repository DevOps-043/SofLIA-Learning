import type { AdminWorkshopBadgeConfig, AdminWorkshopDisplayTheme } from './admin-workshops-display.service'
import { getAdminWorkshopLevelKey } from './admin-workshops-filter.service'

export function getAdminWorkshopLevelConfig(
  level: string,
  theme: AdminWorkshopDisplayTheme,
): AdminWorkshopBadgeConfig {
  const levelKey = getAdminWorkshopLevelKey(level)
  switch (levelKey) {
    case 'beginner':
      return { labelKey: 'workshops.card.level.beginner', fallbackLabel: 'Principiante', color: theme.successColor, bg: `color-mix(in srgb, ${theme.successColor} 7.8%, transparent)`, border: `color-mix(in srgb, ${theme.successColor} 14.9%, transparent)` }
    case 'intermediate':
      return { labelKey: 'workshops.card.level.intermediate', fallbackLabel: 'Intermedio', color: theme.warningColor, bg: `color-mix(in srgb, ${theme.warningColor} 7.8%, transparent)`, border: `color-mix(in srgb, ${theme.warningColor} 14.9%, transparent)` }
    case 'advanced':
      return { labelKey: 'workshops.card.level.advanced', fallbackLabel: 'Avanzado', color: theme.dangerColor, bg: `color-mix(in srgb, ${theme.dangerColor} 7.8%, transparent)`, border: `color-mix(in srgb, ${theme.dangerColor} 14.9%, transparent)` }
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
      return { fallbackLabel: category, color: theme.primaryColor, bg: `color-mix(in srgb, ${theme.primaryColor} 7.8%, transparent)`, border: `color-mix(in srgb, ${theme.primaryColor} 14.9%, transparent)` }
    case 'tecnologia':
    case 'Frontend':
    case 'frontend':
    case 'Backend':
    case 'backend':
      return { fallbackLabel: category, color: theme.secondaryColor, bg: `color-mix(in srgb, ${theme.secondaryColor} 7.8%, transparent)`, border: `color-mix(in srgb, ${theme.secondaryColor} 14.9%, transparent)` }
    case 'negocios':
      return { fallbackLabel: category, color: theme.successColor, bg: `color-mix(in srgb, ${theme.successColor} 7.8%, transparent)`, border: `color-mix(in srgb, ${theme.successColor} 14.9%, transparent)` }
    case 'diseno':
    case 'Diseno':
    case 'design':
      return { fallbackLabel: category, color: theme.warningColor, bg: `color-mix(in srgb, ${theme.warningColor} 7.8%, transparent)`, border: `color-mix(in srgb, ${theme.warningColor} 14.9%, transparent)` }
    default:
      return { fallbackLabel: category, color: theme.mutedTextColor, bg: theme.inputBg, border: theme.borderColor }
  }
}

export function getAdminWorkshopStatusConfig(
  isActive: boolean,
  theme: AdminWorkshopDisplayTheme,
): AdminWorkshopBadgeConfig {
  return isActive
    ? { labelKey: 'workshops.card.statusActive', fallbackLabel: 'Activo', color: theme.successColor, bg: `color-mix(in srgb, ${theme.successColor} 7.8%, transparent)`, border: `color-mix(in srgb, ${theme.successColor} 14.9%, transparent)` }
    : { labelKey: 'workshops.card.statusInactive', fallbackLabel: 'Inactivo', color: theme.mutedTextColor, bg: theme.inputBg, border: theme.borderColor }
}
