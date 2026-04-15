'use client'

import { motion } from 'framer-motion'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

import {
  adminCompaniesColors,
  type AdminCompaniesThemeColors,
} from '../../services/admin-companies'

interface AdminCompaniesFiltersProps {
  searchTerm: string
  planFilter: string
  statusFilter: string
  filteredCount: number
  onSearchChange: (value: string) => void
  onPlanChange: (value: string) => void
  onStatusChange: (value: string) => void
  themeColors: AdminCompaniesThemeColors
}

export function AdminCompaniesFilters({
  searchTerm,
  planFilter,
  statusFilter,
  filteredCount,
  onSearchChange,
  onPlanChange,
  onStatusChange,
  themeColors,
}: AdminCompaniesFiltersProps) {
  const { t } = useTranslation('admin')
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mb-8 rounded-2xl border p-5 transition-colors"
      style={{
        backgroundColor: themeColors.cardBackground,
        borderColor: `${themeColors.borderColor}30`,
      }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <MagnifyingGlassIcon
            className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2"
            style={{ color: adminCompaniesColors.grayMedium }}
          />
          <input
            type="text"
            placeholder={t('searchPlaceholders.companies')}
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            className="w-full rounded-xl border py-3 pl-12 pr-4 focus:outline-none focus:ring-2"
            style={{
              borderColor: `${themeColors.borderColor}30`,
              backgroundColor: themeColors.inputBg,
              color: themeColors.textPrimary,
            }}
          />
        </div>

        <div className="flex gap-3">
          <select
            value={planFilter}
            onChange={(event) => onPlanChange(event.target.value)}
            className="rounded-xl border px-4 py-3 focus:outline-none focus:ring-2"
            style={{
              borderColor: `${themeColors.borderColor}30`,
              backgroundColor: themeColors.inputBg,
              color: themeColors.textPrimary,
            }}
          >
            <option value="all">Todos los planes</option>
            <option value="team">Team</option>
            <option value="business">Business</option>
            <option value="enterprise">Enterprise</option>
          </select>
          <select
            value={statusFilter}
            onChange={(event) => onStatusChange(event.target.value)}
            className="rounded-xl border px-4 py-3 focus:outline-none focus:ring-2"
            style={{
              borderColor: `${themeColors.borderColor}30`,
              backgroundColor: themeColors.inputBg,
              color: themeColors.textPrimary,
            }}
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activas</option>
            <option value="pending">Pendientes</option>
            <option value="trial">En trial</option>
            <option value="paused">Pausadas</option>
            <option value="expired">Expiradas</option>
          </select>
        </div>

        <div className="text-sm" style={{ color: themeColors.textSecondary }}>
          {filteredCount} empresas
        </div>
      </div>
    </motion.section>
  )
}
