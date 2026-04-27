'use client'

import { motion } from 'framer-motion'
import { BookOpenIcon } from '@heroicons/react/24/outline'

import { AdminSurface } from '../ui'
import { useAdminTheme } from '../../hooks/useAdminTheme'

interface AdminWorkshopsEmptyStateProps {
  hasActiveFilters: boolean
}

export function AdminWorkshopsEmptyState({
  hasActiveFilters,
}: AdminWorkshopsEmptyStateProps) {
  const theme = useAdminTheme()

  return (
    <AdminSurface className="p-10 sm:p-12">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center text-center"
      >
        <div className="mb-4 rounded-2xl p-4" style={{ backgroundColor: theme.actionSurface, color: theme.action }}>
          <BookOpenIcon className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-semibold" style={{ color: theme.text }}>
          No se encontraron talleres
        </h3>
        <p className="mt-2 max-w-md text-sm leading-6" style={{ color: theme.textMuted }}>
          {hasActiveFilters
            ? 'Intenta ajustar los filtros de busqueda'
            : 'No hay talleres creados en el sistema'}
        </p>
      </motion.div>
    </AdminSurface>
  )
}
