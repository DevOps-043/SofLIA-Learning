'use client'

import { Filter } from 'lucide-react'
import type { TFunction } from 'i18next'
import { BusinessPanelSearchInput } from '@/features/business-panel/components/shared/BusinessPanelSearchInput'
import { PremiumSelect } from '@/features/business-panel/components/PremiumSelect'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import { ADMIN_ROLE_FILTERS, type AdminRoleFilter, type AdminUsersViewMode } from './types'
import { AdminUsersViewModeToggle } from './AdminUsersViewModeToggle'

interface AdminUsersFilterBarProps {
  searchTerm: string
  roleFilter: AdminRoleFilter
  viewMode: AdminUsersViewMode
  onSearchChange: (value: string) => void
  onRoleFilterChange: (value: AdminRoleFilter) => void
  onViewModeChange: (value: AdminUsersViewMode) => void
  t: TFunction<'admin'>
}

export function AdminUsersFilterBar({
  searchTerm,
  roleFilter,
  viewMode,
  onSearchChange,
  onRoleFilterChange,
  onViewModeChange,
  t,
}: AdminUsersFilterBarProps) {
  const theme = useAdminPanelTheme()

  const roleOptions = ADMIN_ROLE_FILTERS.map((role) => ({
    value: role,
    label: role === 'all' ? t('users.page.filterRoleAll') : t(`users.roles.${role}`),
  }))

  return (
    <div
      className="rounded-[20px] border p-3 shadow-sm"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.borderColor,
      }}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <BusinessPanelSearchInput
          value={searchTerm}
          onChange={onSearchChange}
          placeholder={t('users.page.searchPlaceholder')}
          className="min-w-0 flex-1"
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:flex-shrink-0">
          <PremiumSelect
            value={roleFilter}
            onValueChange={(value) => onRoleFilterChange(value as AdminRoleFilter)}
            options={roleOptions}
            placeholder={t('users.page.filterRoleAll')}
            icon={<Filter className="h-4 w-4" />}
            className="w-full sm:w-[220px]"
          />

          <AdminUsersViewModeToggle
            value={viewMode}
            onChange={onViewModeChange}
            t={t}
          />
        </div>
      </div>
    </div>
  )
}
