'use client'

import { motion } from 'framer-motion'
import { Filter, LayoutGrid, List, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AdminInput, AdminSelect, AdminToolbar } from '../ui'
import { useAdminTheme } from '../../hooks/useAdminTheme'
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
  const theme = useAdminTheme()

  const viewButtonStyle = (active: boolean) => ({
    backgroundColor: active ? theme.action : 'transparent',
    color: active ? theme.onAction : theme.textMuted,
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <AdminToolbar className="mb-0">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: theme.textMuted }} />
          <AdminInput
            type="text"
            placeholder={t('searchPlaceholders.communities')}
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden items-center gap-2 lg:flex" style={{ color: theme.textMuted }}>
            <Filter className="w-4 h-4" />
          </div>

          <AdminSelect
            value={filterCategory}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="min-w-[180px]"
          >
            <option value="all">{t('communities.filters.allCategories')}</option>
            <option value="Publica">{t('communities.filters.public')}</option>
            <option value="Privada">{t('communities.filters.private')}</option>
            <option value="Moderada">{t('communities.filters.moderated')}</option>
          </AdminSelect>

          <AdminSelect
            value={filterStatus}
            onChange={(event) => onStatusChange(event.target.value)}
            className="min-w-[160px]"
          >
            <option value="all">{t('communities.filters.allStatuses')}</option>
            <option value="active">{t('communities.filters.active')}</option>
            <option value="inactive">{t('communities.filters.inactive')}</option>
          </AdminSelect>

          <div className="flex items-center gap-1 rounded-xl border p-1" style={{ backgroundColor: theme.surfaceSubtle, borderColor: theme.border }}>
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              className="rounded-lg p-2.5 transition hover:opacity-80"
              style={viewButtonStyle(viewMode === 'grid')}
              aria-label={t('communities.filters.gridView')}
              title={t('communities.filters.gridView')}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              className="rounded-lg p-2.5 transition hover:opacity-80"
              style={viewButtonStyle(viewMode === 'list')}
              aria-label={t('communities.filters.listView')}
              title={t('communities.filters.listView')}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </AdminToolbar>
    </motion.div>
  )
}
