'use client'

import { motion } from 'framer-motion'
import {
  FunnelIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-4 mb-6 shadow-sm"
    >
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#6C757D] dark:text-white/60" />
          <input
            type="text"
            placeholder="Buscar talleres..."
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
          />
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-[#6C757D] dark:text-white/60" />
          <select
            value={filterCategory}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="px-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200 text-sm"
          >
            {ADMIN_WORKSHOP_CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(event) => onStatusChange(event.target.value)}
            className="px-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200 text-sm"
          >
            {ADMIN_WORKSHOP_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </motion.div>
  )
}
