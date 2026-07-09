'use client'

import { motion } from 'framer-motion'
import { BadgeCheck, BriefcaseBusiness, SlidersHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { BusinessPanelSearchInput } from '@/features/business-panel/components/shared/BusinessPanelSearchInput'
import { PremiumSelect } from '@/features/business-panel/components/PremiumSelect'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import { AdminCompaniesViewToggle, type CompaniesViewMode } from './AdminCompaniesViewToggle'

interface AdminCompaniesFiltersProps {
  searchTerm: string
  planFilter: string
  statusFilter: string
  filteredCount: number
  viewMode: CompaniesViewMode
  onSearchChange: (value: string) => void
  onPlanChange: (value: string) => void
  onStatusChange: (value: string) => void
  onViewModeChange: (mode: CompaniesViewMode) => void
}

export function AdminCompaniesFilters({
  searchTerm,
  planFilter,
  statusFilter,
  filteredCount,
  viewMode,
  onSearchChange,
  onPlanChange,
  onStatusChange,
  onViewModeChange,
}: AdminCompaniesFiltersProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()

  const planOptions = [
    { value: 'all', label: t('companies.filters.allPlans') },
    { value: 'team', label: t('companies.plans.team') },
    { value: 'business', label: t('companies.plans.business') },
    { value: 'enterprise', label: t('companies.plans.enterprise') },
  ]

  const statusOptions = [
    { value: 'all', label: t('companies.filters.allStatuses') },
    { value: 'active', label: t('companies.status.active') },
    { value: 'pending', label: t('companies.status.pending') },
    { value: 'trial', label: t('companies.status.trial') },
    { value: 'paused', label: t('companies.status.paused') },
    { value: 'expired', label: t('companies.status.expired') },
  ]

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
          placeholder={t('searchPlaceholders.companies')}
          className="min-w-0 flex-1"
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:flex xl:flex-shrink-0">
          <PremiumSelect
            value={planFilter}
            onValueChange={onPlanChange}
            options={planOptions}
            placeholder={t('companies.filters.allPlans')}
            icon={<BriefcaseBusiness className="h-4 w-4" />}
            className="w-full sm:min-w-[200px]"
          />
          <PremiumSelect
            value={statusFilter}
            onValueChange={onStatusChange}
            options={statusOptions}
            placeholder={t('companies.filters.allStatuses')}
            icon={<SlidersHorizontal className="h-4 w-4" />}
            className="w-full sm:min-w-[210px]"
          />
        </div>

        <div className="flex items-center gap-2 xl:flex-shrink-0">
          <div
            className="flex h-[50px] items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-bold"
            style={{
              backgroundColor: theme.inputBg,
              borderColor: theme.borderColor,
              color: theme.subtextColor,
            }}
          >
            <BadgeCheck className="h-4 w-4" style={{ color: theme.primaryColor }} />
            {t('companies.filters.resultCount', { count: filteredCount })}
          </div>
          <AdminCompaniesViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
        </div>
      </div>
    </motion.section>
  )
}

