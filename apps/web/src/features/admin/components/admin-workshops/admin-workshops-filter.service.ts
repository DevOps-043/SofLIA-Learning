import type { AdminWorkshop } from '../../services/adminWorkshops.service'
import type { AdminWorkshopFilters } from './types'

export function filterAdminWorkshops(
  workshops: AdminWorkshop[],
  filters: AdminWorkshopFilters,
): AdminWorkshop[] {
  const normalizedSearch = filters.searchTerm.trim().toLowerCase()

  return workshops.filter((workshop) => {
    if (workshop.approval_status === 'pending' || workshop.approval_status === 'rejected') {
      return false
    }

    const matchesSearch =
      normalizedSearch.length === 0 ||
      workshop.title.toLowerCase().includes(normalizedSearch) ||
      workshop.description.toLowerCase().includes(normalizedSearch) ||
      (workshop.instructor_name || '').toLowerCase().includes(normalizedSearch)
    const matchesCategory =
      filters.category === 'all' || workshop.category.toLowerCase() === filters.category
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
