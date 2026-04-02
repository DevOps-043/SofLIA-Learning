'use client'

import { motion } from 'framer-motion'
import {
  ArrowPathIcon,
  BuildingOffice2Icon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

import {
  adminCompaniesColors,
  type AdminCompaniesThemeColors,
} from '../../services/admin-companies'

interface AdminCompaniesLoadingStateProps {
  themeColors: AdminCompaniesThemeColors
}

export function AdminCompaniesLoadingState({ themeColors }: AdminCompaniesLoadingStateProps) {
  return (
    <div className="min-h-screen p-6 lg:p-8" style={{ backgroundColor: themeColors.background }}>
      <div className="animate-pulse space-y-8">
        <div className="h-12 w-1/3 rounded-xl bg-gray-800" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-36 rounded-2xl bg-gray-800" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-72 rounded-2xl bg-gray-800" />
          ))}
        </div>
      </div>
    </div>
  )
}

interface AdminCompaniesErrorStateProps {
  error: string
  onRetry: () => void
  themeColors: AdminCompaniesThemeColors
}

export function AdminCompaniesErrorState({
  error,
  onRetry,
  themeColors,
}: AdminCompaniesErrorStateProps) {
  return (
    <div
      className="flex min-h-screen items-center justify-center p-6 lg:p-8"
      style={{ backgroundColor: themeColors.background }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md rounded-2xl border p-8 text-center"
        style={{
          backgroundColor: themeColors.cardBackground,
          borderColor: `${adminCompaniesColors.error}30`,
        }}
      >
        <ExclamationTriangleIcon className="mx-auto mb-4 h-12 w-12" style={{ color: adminCompaniesColors.error }} />
        <h2 className="mb-2 text-xl font-bold" style={{ color: themeColors.textPrimary }}>
          Error al cargar
        </h2>
        <p className="mb-6" style={{ color: adminCompaniesColors.grayMedium }}>
          {error}
        </p>
        <motion.button
          onClick={onRetry}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mx-auto flex items-center gap-2 rounded-xl px-6 py-3 font-medium"
          style={{ backgroundColor: adminCompaniesColors.accent, color: adminCompaniesColors.primary }}
        >
          <ArrowPathIcon className="h-5 w-5" />
          Reintentar
        </motion.button>
      </motion.div>
    </div>
  )
}

interface AdminCompaniesEmptyStateProps {
  themeColors: AdminCompaniesThemeColors
}

export function AdminCompaniesEmptyState({ themeColors }: AdminCompaniesEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="col-span-full rounded-2xl border p-12 text-center transition-colors"
      style={{
        backgroundColor: themeColors.cardBackground,
        borderColor: `${themeColors.borderColor}30`,
      }}
    >
      <BuildingOffice2Icon className="mx-auto mb-4 h-16 w-16" style={{ color: themeColors.textSecondary }} />
      <p className="mb-2 text-lg font-medium" style={{ color: themeColors.textPrimary }}>
        No se encontraron empresas
      </p>
      <p style={{ color: themeColors.textSecondary }}>Intenta ajustar los filtros de busqueda</p>
    </motion.div>
  )
}
