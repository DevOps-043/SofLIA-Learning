'use client'

import { Building2, Filter, GraduationCap, Route } from 'lucide-react'
import type { TFunction } from 'i18next'
import { BusinessPanelSearchInput } from '@/features/business-panel/components/shared/BusinessPanelSearchInput'
import { PremiumSelect } from '@/features/business-panel/components/PremiumSelect'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import type { AdminFilterOption } from '../../hooks/useAdminUserStatsFilters'
import { ADMIN_ROLE_FILTERS, type AdminRoleFilter, type AdminUsersViewMode } from './types'
import { AdminUsersViewModeToggle } from './AdminUsersViewModeToggle'

interface AdminUsersFilterBarProps {
  searchTerm: string
  roleFilter: AdminRoleFilter
  viewMode: AdminUsersViewMode
  organizationFilter: string
  courseFilter: string
  learningPathFilter: string
  companyOptions: AdminFilterOption[]
  courseOptions: AdminFilterOption[]
  learningPathOptions: AdminFilterOption[]
  onSearchChange: (value: string) => void
  onRoleFilterChange: (value: AdminRoleFilter) => void
  onViewModeChange: (value: AdminUsersViewMode) => void
  onOrganizationFilterChange: (value: string) => void
  onCourseFilterChange: (value: string) => void
  onLearningPathFilterChange: (value: string) => void
  t: TFunction<'admin'>
}

const ALL_VALUE = 'all'

export function AdminUsersFilterBar({
  searchTerm,
  roleFilter,
  viewMode,
  organizationFilter,
  courseFilter,
  learningPathFilter,
  companyOptions,
  courseOptions,
  learningPathOptions,
  onSearchChange,
  onRoleFilterChange,
  onViewModeChange,
  onOrganizationFilterChange,
  onCourseFilterChange,
  onLearningPathFilterChange,
  t,
}: AdminUsersFilterBarProps) {
  const theme = useAdminPanelTheme()

  const roleOptions = ADMIN_ROLE_FILTERS.map((role) => ({
    value: role,
    label: role === 'all' ? t('users.page.filterRoleAll') : t(`users.roles.${role}`),
  }))

  const withAllOption = (options: AdminFilterOption[], allLabel: string) => [
    { value: ALL_VALUE, label: allLabel },
    ...options,
  ]

  const toFilterValue = (value: string) => (value === ALL_VALUE ? '' : value)

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
            className="w-full sm:w-[200px]"
          />

          <AdminUsersViewModeToggle
            value={viewMode}
            onChange={onViewModeChange}
            t={t}
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <PremiumSelect
          value={organizationFilter || ALL_VALUE}
          onValueChange={(value) => onOrganizationFilterChange(toFilterValue(value))}
          options={withAllOption(companyOptions, t('users.page.filterCompanyAll'))}
          placeholder={t('users.page.filterCompanyAll')}
          icon={<Building2 className="h-4 w-4" />}
          className="w-full"
        />
        <PremiumSelect
          value={courseFilter || ALL_VALUE}
          onValueChange={(value) => onCourseFilterChange(toFilterValue(value))}
          options={withAllOption(courseOptions, t('users.page.filterCourseAll'))}
          placeholder={t('users.page.filterCourseAll')}
          icon={<GraduationCap className="h-4 w-4" />}
          className="w-full"
        />
        <PremiumSelect
          value={learningPathFilter || ALL_VALUE}
          onValueChange={(value) => onLearningPathFilterChange(toFilterValue(value))}
          options={withAllOption(learningPathOptions, t('users.page.filterLearningPathAll'))}
          placeholder={t('users.page.filterLearningPathAll')}
          icon={<Route className="h-4 w-4" />}
          className="w-full"
        />
      </div>
    </div>
  )
}
