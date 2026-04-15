'use client'

import { motion } from 'framer-motion'
import { Filter, LayoutGrid, List, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { adminCommunitiesColors, type AdminCommunitiesViewMode } from './shared'

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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="flex flex-col lg:flex-row gap-4 p-5 rounded-2xl"
      style={{ background: adminCommunitiesColors.bgSecondary }}
    >
      <div className="flex-1 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder={t('searchPlaceholders.communities')}
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[#0F1419] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4B3] focus:ring-1 focus:ring-[#00D4B3] transition-all"
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-gray-500">
          <Filter className="w-4 h-4" />
        </div>

        <select
          value={filterCategory}
          onChange={(event) => onCategoryChange(event.target.value)}
          className="px-4 py-3.5 rounded-xl bg-[#0F1419] border border-white/10 text-white focus:outline-none focus:border-[#00D4B3] transition-all cursor-pointer"
        >
          <option value="all">Todas las categorias</option>
          <option value="Publica">Publicas</option>
          <option value="Privada">Privadas</option>
          <option value="Moderada">Moderadas</option>
        </select>

        <select
          value={filterStatus}
          onChange={(event) => onStatusChange(event.target.value)}
          className="px-4 py-3.5 rounded-xl bg-[#0F1419] border border-white/10 text-white focus:outline-none focus:border-[#00D4B3] transition-all cursor-pointer"
        >
          <option value="all">Todos los estados</option>
          <option value="active">Activas</option>
          <option value="inactive">Inactivas</option>
        </select>

        <div className="flex items-center gap-1 p-1.5 rounded-xl" style={{ background: adminCommunitiesColors.bgTertiary }}>
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#00D4B3] text-white' : 'text-gray-500 hover:text-white'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#00D4B3] text-white' : 'text-gray-500 hover:text-white'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
