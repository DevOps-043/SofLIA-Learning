import type { AdminWorkshop } from '../../services/adminWorkshops.service'
import type { AdminWorkshopFilters, WorkshopBadgeTone } from './types'

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

export function getWorkshopLevelTone(level: string): WorkshopBadgeTone {
  switch (level) {
    case 'beginner':
    case 'Principiante':
      return {
        bg: 'bg-[#10B981]/10 dark:bg-[#10B981]/20',
        text: 'text-[#10B981]',
        border: 'border-[#10B981]/20',
      }
    case 'intermediate':
    case 'Intermedio':
      return {
        bg: 'bg-[#F59E0B]/10 dark:bg-[#F59E0B]/20',
        text: 'text-[#F59E0B]',
        border: 'border-[#F59E0B]/20',
      }
    case 'advanced':
    case 'Avanzado':
      return {
        bg: 'bg-[#EF4444]/10 dark:bg-[#EF4444]/20',
        text: 'text-[#EF4444]',
        border: 'border-[#EF4444]/20',
      }
    default:
      return {
        bg: 'bg-[#6C757D]/10 dark:bg-[#6C757D]/20',
        text: 'text-[#6C757D]',
        border: 'border-[#6C757D]/20',
      }
  }
}

export function getWorkshopCategoryTone(category: string): WorkshopBadgeTone {
  switch (category) {
    case 'Frontend':
    case 'frontend':
      return {
        bg: 'bg-[#0A2540]/10 dark:bg-[#0A2540]/30',
        text: 'text-[#0A2540] dark:text-[#00D4B3]',
        border: 'border-[#0A2540]/20 dark:border-[#00D4B3]/30',
      }
    case 'Backend':
    case 'backend':
    case 'tecnologia':
      return {
        bg: 'bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20',
        text: 'text-[#00D4B3]',
        border: 'border-[#00D4B3]/20',
      }
    case 'Diseno':
    case 'diseno':
    case 'design':
      return {
        bg: 'bg-[#F59E0B]/10 dark:bg-[#F59E0B]/20',
        text: 'text-[#F59E0B]',
        border: 'border-[#F59E0B]/20',
      }
    case 'ia':
    case 'Inteligencia Artificial':
      return {
        bg: 'bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20',
        text: 'text-[#00D4B3]',
        border: 'border-[#00D4B3]/20',
      }
    default:
      return {
        bg: 'bg-[#6C757D]/10 dark:bg-[#6C757D]/20',
        text: 'text-[#6C757D]',
        border: 'border-[#6C757D]/20',
      }
  }
}

export function getWorkshopLevelLabel(level: string): string {
  switch (level) {
    case 'beginner':
      return 'Principiante'
    case 'intermediate':
      return 'Intermedio'
    case 'advanced':
      return 'Avanzado'
    default:
      return level
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
