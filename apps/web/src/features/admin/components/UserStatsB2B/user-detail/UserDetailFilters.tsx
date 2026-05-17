'use client'

import { Funnel } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PremiumSelect } from '@/features/business-panel/components/PremiumSelect'
import { BusinessPanelSearchInput } from '@/features/business-panel/components/shared/BusinessPanelSearchInput'

interface UserDetailFiltersProps {
  search: string
  statusFilter: string
  onSearchChange: (value: string) => void
  onStatusChange: (value: string) => void
}

export function UserDetailFilters({
  search,
  statusFilter,
  onSearchChange,
  onStatusChange,
}: UserDetailFiltersProps) {
  const { t } = useTranslation('admin')

  return (
    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_240px]">
      <BusinessPanelSearchInput value={search} onChange={onSearchChange} placeholder={t('userStats.filters.searchPlaceholder')} />
      <PremiumSelect
        value={statusFilter || 'all'}
        onValueChange={(value) => onStatusChange(value === 'all' ? '' : value)}
        icon={<Funnel className="h-4 w-4" />}
        options={[
          { value: 'all', label: t('userStats.filters.statusAll') },
          { value: 'active', label: t('userStats.filters.statusActive') },
          { value: 'inactive', label: t('userStats.filters.statusInactive') },
        ]}
      />
    </div>
  )
}
