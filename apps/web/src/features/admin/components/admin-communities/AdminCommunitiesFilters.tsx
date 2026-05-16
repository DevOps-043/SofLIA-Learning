'use client'

import { motion } from 'framer-motion'
import { LayoutGrid, List, Lock, SlidersHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PremiumSelect } from '@/features/business-panel/components/PremiumSelect'
import { BusinessPanelSearchInput } from '@/features/business-panel/components/shared/BusinessPanelSearchInput'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import {
  ADMIN_COMMUNITY_CATEGORY_OPTIONS,
  ADMIN_COMMUNITY_STATUS_OPTIONS,
} from './admin-communities-display.service'
import type { AdminCommunitiesViewMode } from './shared'

interface AdminCommunitiesFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  filterCategory: string
  onCategoryChange: (value: string) => void
  filterStatus: string
  onStatusChange: (value: string) => void
  viewMode: AdminCommunitiesViewMode
  onViewModeChange: (value: AdminCommunitiesViewMode) => void
}

export function AdminCommunitiesFilters({
  searchTerm,
  onSearchChange,
  filterCategory,
  onCategoryChange,
  filterStatus,
  onStatusChange,
  viewMode,
  onViewModeChange,
}: AdminCommunitiesFiltersProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()

  const categoryOptions = ADMIN_COMMUNITY_CATEGORY_OPTIONS.map((option) => ({
    value: option.value,
    label: t(option.labelKey),
  }))
  const statusOptions = ADMIN_COMMUNITY_STATUS_OPTIONS.map((option) => ({
    value: option.value,
    label: t(option.labelKey),
  }))

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="mb-6 rounded-[20px] border p-3 shadow-sm"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.borderColor,
      }}
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <BusinessPanelSearchInput
          value={searchTerm}
          onChange={onSearchChange}
          placeholder={t('searchPlaceholders.communities')}
          className="min-w-0 flex-1"
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:flex xl:flex-shrink-0">
          <PremiumSelect
            value={filterCategory}
            onValueChange={onCategoryChange}
            options={categoryOptions}
            placeholder={t('communities.filters.categories.all')}
            icon={<Lock className="h-4 w-4" />}
            className="w-full sm:min-w-[220px]"
          />
          <PremiumSelect
            value={filterStatus}
            onValueChange={onStatusChange}
            options={statusOptions}
            placeholder={t('communities.filters.status.all')}
            icon={<SlidersHorizontal className="h-4 w-4" />}
            className="w-full sm:min-w-[200px]"
          />
        </div>

        <div
          className="flex items-center gap-1 rounded-xl border p-1"
          style={{
            backgroundColor: theme.inputBg,
            borderColor: theme.borderColor,
          }}
        >
          {[
            { value: 'grid' as const, icon: LayoutGrid, label: t('communities.view.grid') },
            { value: 'list' as const, icon: List, label: t('communities.view.list') },
          ].map((item) => {
            const Icon = item.icon
            const isActive = viewMode === item.value

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onViewModeChange(item.value)}
                aria-label={item.label}
                title={item.label}
                className="rounded-lg p-2.5 transition-all"
                style={{
                  backgroundColor: isActive ? theme.primaryColor : 'transparent',
                  color: isActive ? theme.onPrimaryColor : theme.subtextColor,
                }}
              >
                <Icon className="h-4 w-4" />
              </button>
            )
          })}
        </div>
      </div>
    </motion.section>
  )
}
