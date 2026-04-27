'use client'

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

import { AdminInput, AdminSelect, AdminToolbar } from '../ui'
import { useAdminTheme } from '../../hooks/useAdminTheme'
import type { AdminCompaniesThemeColors } from '../../services/admin-companies'

interface AdminCompaniesFiltersProps {
  searchTerm: string
  planFilter: string
  statusFilter: string
  filteredCount: number
  onSearchChange: (value: string) => void
  onPlanChange: (value: string) => void
  onStatusChange: (value: string) => void
  themeColors: AdminCompaniesThemeColors
}

export function AdminCompaniesFilters({
  searchTerm,
  planFilter,
  statusFilter,
  filteredCount,
  onSearchChange,
  onPlanChange,
  onStatusChange,
}: AdminCompaniesFiltersProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()

  return (
    <AdminToolbar>
      <div className="relative min-w-0 flex-1">
        <MagnifyingGlassIcon
          className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2"
          style={{ color: theme.textMuted }}
        />
        <AdminInput
          type="text"
          placeholder={t('searchPlaceholders.companies')}
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <AdminSelect value={planFilter} onChange={(event) => onPlanChange(event.target.value)}>
          <option value="all">Todos los planes</option>
          <option value="team">Team</option>
          <option value="business">Business</option>
          <option value="enterprise">Enterprise</option>
        </AdminSelect>

        <AdminSelect value={statusFilter} onChange={(event) => onStatusChange(event.target.value)}>
          <option value="all">Todos los estados</option>
          <option value="active">Activas</option>
          <option value="pending">Pendientes</option>
          <option value="trial">En trial</option>
          <option value="paused">Pausadas</option>
          <option value="expired">Expiradas</option>
        </AdminSelect>
      </div>

      <div className="text-sm font-medium lg:ml-auto" style={{ color: theme.textMuted }}>
        {filteredCount} empresas
      </div>
    </AdminToolbar>
  )
}
