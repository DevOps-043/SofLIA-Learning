'use client'

import { motion } from 'framer-motion'
import { Layers3, SlidersHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { BusinessPanelSearchInput } from '@/features/business-panel/components/shared/BusinessPanelSearchInput'
import { PremiumSelect } from '@/features/business-panel/components/PremiumSelect'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import {
  ADMIN_WORKSHOP_CATEGORY_OPTIONS,
  ADMIN_WORKSHOP_STATUS_OPTIONS,
} from './admin-workshops-display.service'

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
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()

  const categoryOptions = ADMIN_WORKSHOP_CATEGORY_OPTIONS.map((option) => ({
    value: option.value,
    label: t(`workshops.filters.categories.${option.value}`),
  }))
  const statusOptions = ADMIN_WORKSHOP_STATUS_OPTIONS.map((option) => ({
    value: option.value,
    label: t(`workshops.filters.status.${option.value}`),
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
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <BusinessPanelSearchInput
          value={searchTerm}
          onChange={onSearchChange}
          placeholder={t('workshops.filters.searchPlaceholder')}
          className="min-w-0 flex-1"
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:flex-shrink-0">
          <PremiumSelect
            value={filterCategory}
            onValueChange={onCategoryChange}
            options={categoryOptions}
            placeholder={t('workshops.filters.categories.all')}
            icon={<Layers3 className="h-4 w-4" />}
            className="w-full sm:min-w-[220px]"
          />
          <PremiumSelect
            value={filterStatus}
            onValueChange={onStatusChange}
            options={statusOptions}
            placeholder={t('workshops.filters.status.all')}
            icon={<SlidersHorizontal className="h-4 w-4" />}
            className="w-full sm:min-w-[200px]"
          />
        </div>
      </div>
    </motion.section>
  )
}
