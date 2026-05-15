'use client'

import { Filter, LayoutGrid, List } from 'lucide-react'
import type { TFunction } from 'i18next'
import { BusinessPanelSearchInput } from '@/features/business-panel/components/shared/BusinessPanelSearchInput'
import { PremiumSelect } from '@/features/business-panel/components/PremiumSelect'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import { ADMIN_ROLE_FILTERS, type AdminRoleFilter, type AdminUsersViewMode } from './types'

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

  const viewOptions = [
    {
      value: 'cards' as const,
      label: t('users.page.view.cards'),
      icon: LayoutGrid,
    },
    {
      value: 'list' as const,
      label: t('users.page.view.list'),
      icon: List,
    },
  ]

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

          <div
            className="grid h-[50px] grid-cols-2 rounded-2xl border p-1"
            style={{
              backgroundColor: theme.inputBg,
              borderColor: theme.borderColor,
            }}
          >
            {viewOptions.map((option) => {
              const Icon = option.icon
              const isActive = viewMode === option.value

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onViewModeChange(option.value)}
                  className="flex h-10 min-w-[46px] items-center justify-center rounded-xl transition-all"
                  style={{
                    backgroundColor: isActive ? theme.primaryColor : 'transparent',
                    color: isActive ? theme.onPrimaryColor : theme.mutedTextColor,
                    boxShadow: isActive ? `0 8px 20px ${theme.primaryColor}25` : 'none',
                  }}
                  aria-label={option.label}
                  title={option.label}
                >
                  <Icon className="h-4 w-4" />
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
