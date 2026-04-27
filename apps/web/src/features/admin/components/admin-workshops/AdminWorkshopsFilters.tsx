'use client'

import {
  FunnelIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import {
  ADMIN_WORKSHOP_CATEGORY_OPTIONS,
  ADMIN_WORKSHOP_STATUS_OPTIONS,
} from './admin-workshops-display.service'
import { AdminInput, AdminSelect, AdminToolbar } from '../ui'
import { useAdminTheme } from '../../hooks/useAdminTheme'

interface AdminWorkshopsFiltersProps {
  searchTerm: string
  filterCategory: string
  filterStatus: string
  onSearchChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onStatusChange: (value: string) => void
}

export function AdminWorkshopsFilters({
  searchTerm,
  filterCategory,
  filterStatus,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
}: AdminWorkshopsFiltersProps) {
  const theme = useAdminTheme()

  return (
    <AdminToolbar>
      <div className="relative min-w-0 flex-1">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" style={{ color: theme.textMuted }} />
        <AdminInput
          type="text"
          placeholder="Buscar talleres..."
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          className="pl-10"
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <FunnelIcon className="hidden h-5 w-5 sm:block" style={{ color: theme.textMuted }} />
        <AdminSelect value={filterCategory} onChange={(event) => onCategoryChange(event.target.value)}>
          {ADMIN_WORKSHOP_CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </AdminSelect>
        <AdminSelect value={filterStatus} onChange={(event) => onStatusChange(event.target.value)}>
          {ADMIN_WORKSHOP_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </AdminSelect>
      </div>
    </AdminToolbar>
  )
}
