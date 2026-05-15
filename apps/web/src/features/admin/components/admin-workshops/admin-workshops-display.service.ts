import type { AdminWorkshop } from '../../services/adminWorkshops.service'
import type { AdminWorkshopFilters } from './types'

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

export const ADMIN_WORKSHOP_CATEGORY_OPTIONS = [
  { value: 'all', label: 'Todas las categorias' },
  { value: 'ia', label: 'Inteligencia Artificial' },
  { value: 'tecnologia', label: 'Tecnologia' },
  { value: 'negocios', label: 'Negocios' },
  { value: 'diseno', label: 'Diseno' },
  { value: 'marketing', label: 'Marketing' },
] as const

export const ADMIN_WORKSHOP_STATUS_OPTIONS = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
] as const

export function filterAdminWorkshops(
  workshops: AdminWorkshop[],
  filters: AdminWorkshopFilters,
): AdminWorkshop[] {
  const normalizedSearch = filters.searchTerm.trim().toLowerCase()

  return workshops.filter((workshop) => {
    if (
      workshop.approval_status === 'pending' ||
      workshop.approval_status === 'rejected'
    ) {
      return false
    }

    const matchesSearch =
      normalizedSearch.length === 0 ||
      workshop.title.toLowerCase().includes(normalizedSearch) ||
      workshop.description.toLowerCase().includes(normalizedSearch) ||
      (workshop.instructor_name || '').toLowerCase().includes(normalizedSearch)

    const matchesCategory =
      filters.category === 'all' ||
      workshop.category.toLowerCase() === filters.category

    const matchesStatus =
      filters.status === 'all' ||
      (filters.status === 'active' && workshop.is_active) ||
      (filters.status === 'inactive' && !workshop.is_active)

    return matchesSearch && matchesCategory && matchesStatus
  })
}

export function getAdminWorkshopLevelKey(level: string) {
  switch (level) {
    case 'Principiante':
      return 'beginner'
    case 'Intermedio':
      return 'intermediate'
    case 'Avanzado':
      return 'advanced'
    default:
      return level || 'beginner'
  }
}

export function getAdminWorkshopLevelConfig(
  level: string,
  theme: AdminWorkshopDisplayTheme,
): AdminWorkshopBadgeConfig {
  const levelKey = getAdminWorkshopLevelKey(level)

  switch (levelKey) {
    case 'beginner':
      return {
        labelKey: 'workshops.card.level.beginner',
        fallbackLabel: 'Principiante',
        color: theme.successColor,
        bg: `${theme.successColor}14`,
        border: `${theme.successColor}26`,
      }
    case 'intermediate':
      return {
        labelKey: 'workshops.card.level.intermediate',
        fallbackLabel: 'Intermedio',
        color: theme.warningColor,
        bg: `${theme.warningColor}14`,
        border: `${theme.warningColor}26`,
      }
    case 'advanced':
      return {
        labelKey: 'workshops.card.level.advanced',
        fallbackLabel: 'Avanzado',
        color: theme.dangerColor,
        bg: `${theme.dangerColor}14`,
        border: `${theme.dangerColor}26`,
      }
    default:
      return {
        fallbackLabel: level,
        color: theme.mutedTextColor,
        bg: theme.inputBg,
        border: theme.borderColor,
      }
  }
}

export function getAdminWorkshopCategoryConfig(
  category: string,
  theme: AdminWorkshopDisplayTheme,
): AdminWorkshopBadgeConfig {
  switch (category) {
    case 'ia':
    case 'Inteligencia Artificial':
      return {
        fallbackLabel: category,
        color: theme.primaryColor,
        bg: `${theme.primaryColor}14`,
        border: `${theme.primaryColor}26`,
      }
    case 'tecnologia':
    case 'Frontend':
    case 'frontend':
    case 'Backend':
    case 'backend':
      return {
        fallbackLabel: category,
        color: theme.secondaryColor,
        bg: `${theme.secondaryColor}14`,
        border: `${theme.secondaryColor}26`,
      }
    case 'negocios':
      return {
        fallbackLabel: category,
        color: theme.successColor,
        bg: `${theme.successColor}14`,
        border: `${theme.successColor}26`,
      }
    case 'diseno':
    case 'Diseno':
    case 'design':
      return {
        fallbackLabel: category,
        color: theme.warningColor,
        bg: `${theme.warningColor}14`,
        border: `${theme.warningColor}26`,
      }
    default:
      return {
        fallbackLabel: category,
        color: theme.mutedTextColor,
        bg: theme.inputBg,
        border: theme.borderColor,
      }
  }
}

export function getAdminWorkshopStatusConfig(
  isActive: boolean,
  theme: AdminWorkshopDisplayTheme,
): AdminWorkshopBadgeConfig {
  return isActive
    ? {
        labelKey: 'workshops.card.statusActive',
        fallbackLabel: 'Activo',
        color: theme.successColor,
        bg: `${theme.successColor}14`,
        border: `${theme.successColor}26`,
      }
    : {
        labelKey: 'workshops.card.statusInactive',
        fallbackLabel: 'Inactivo',
        color: theme.mutedTextColor,
        bg: theme.inputBg,
        border: theme.borderColor,
      }
}

export function formatWorkshopDuration(minutes: number): string {
  if (!minutes || minutes <= 0) {
    return '0 min'
  }

  if (minutes < 60) {
    return `${minutes} min`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (remainingMinutes === 0) {
    return `${hours}h`
  }

  return `${hours}h ${remainingMinutes}min`
}

export function getWorkshopInstructorInitials(name?: string | null): string {
  if (!name || name === 'Sin instructor') {
    return 'SI'
  }

  const names = name.split(' ').filter(Boolean)
  if (names.length >= 2) {
    return `${names[0]?.[0] || ''}${names[1]?.[0] || ''}`.toUpperCase()
  }

  return name.substring(0, 2).toUpperCase()
}

export async function updateAdminWorkshop(
  workshopId: string,
  data: unknown,
): Promise<void> {
  const response = await fetch(`/api/admin/workshops/${workshopId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const errorMessage =
      typeof errorData.error === 'string'
        ? errorData.error
        : 'Error al actualizar el taller'
    throw new Error(errorMessage)
  }
}

export async function deleteAdminWorkshop(workshopId: string): Promise<void> {
  const response = await fetch(`/api/admin/workshops/${workshopId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const errorMessage =
      typeof errorData.error === 'string'
        ? errorData.error
        : 'Error al eliminar el taller'
    throw new Error(errorMessage)
  }
}
