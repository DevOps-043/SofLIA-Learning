'use client'

import { motion } from 'framer-motion'
import { XMarkIcon } from '@heroicons/react/24/outline'

import { AdminButton, AdminPageShell, AdminSurface } from '../ui'
import { useAdminTheme } from '../../hooks/useAdminTheme'

interface AdminWorkshopsErrorStateProps {
  error: string
  onRetry: () => void
}

export function AdminWorkshopsErrorState({
  error,
  onRetry,
}: AdminWorkshopsErrorStateProps) {
  const theme = useAdminTheme()

  return (
    <AdminPageShell className="py-6 lg:py-8" maxWidth="wide">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <AdminSurface className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: theme.dangerSurface, color: theme.danger }}
            >
              <XMarkIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold" style={{ color: theme.text }}>
                Error al cargar los talleres
              </h3>
              <p className="mt-1 text-sm leading-6" style={{ color: theme.textMuted }}>
                {error}
              </p>
              <AdminButton className="mt-4" onClick={onRetry} size="sm" variant="danger">
                Reintentar
              </AdminButton>
            </div>
          </div>
        </AdminSurface>
      </motion.div>
    </AdminPageShell>
  )
}
