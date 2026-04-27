'use client'

import {
  ArrowPathIcon,
  BuildingOffice2Icon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

import { AdminButton, AdminPageShell, AdminSurface } from '../ui'
import { useAdminTheme } from '../../hooks/useAdminTheme'
import type { AdminCompaniesThemeColors } from '../../services/admin-companies'

interface AdminCompaniesLoadingStateProps {
  themeColors: AdminCompaniesThemeColors
}

export function AdminCompaniesLoadingState(_: AdminCompaniesLoadingStateProps) {
  const theme = useAdminTheme()

  return (
    <AdminPageShell className="py-6 lg:py-8" maxWidth="wide">
      <div className="animate-pulse space-y-8">
        <div className="h-12 w-1/3 rounded-xl" style={{ backgroundColor: theme.surfaceSubtle }} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-32 rounded-2xl" style={{ backgroundColor: theme.surfaceSubtle }} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-72 rounded-2xl" style={{ backgroundColor: theme.surfaceSubtle }} />
          ))}
        </div>
      </div>
    </AdminPageShell>
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
}: AdminCompaniesErrorStateProps) {
  const theme = useAdminTheme()

  return (
    <AdminPageShell className="flex min-h-screen items-center justify-center">
      <AdminSurface
        className="max-w-md p-8 text-center"
        style={{
          backgroundColor: theme.dangerSurface,
          borderColor: theme.danger,
        }}
      >
        <ExclamationTriangleIcon className="mx-auto mb-4 h-12 w-12" style={{ color: theme.danger }} />
        <h2 className="mb-2 text-xl font-bold" style={{ color: theme.text }}>
          Error al cargar
        </h2>
        <p className="mb-6 text-sm" style={{ color: theme.textMuted }}>
          {error}
        </p>
        <AdminButton onClick={onRetry} icon={ArrowPathIcon}>
          Reintentar
        </AdminButton>
      </AdminSurface>
    </AdminPageShell>
  )
}

interface AdminCompaniesEmptyStateProps {
  themeColors: AdminCompaniesThemeColors
}

export function AdminCompaniesEmptyState(_: AdminCompaniesEmptyStateProps) {
  const theme = useAdminTheme()

  return (
    <AdminSurface className="col-span-full p-12 text-center">
      <BuildingOffice2Icon className="mx-auto mb-4 h-14 w-14" style={{ color: theme.textMuted }} />
      <p className="mb-2 text-lg font-semibold" style={{ color: theme.text }}>
        No se encontraron empresas
      </p>
      <p className="text-sm" style={{ color: theme.textMuted }}>
        Intenta ajustar los filtros de busqueda.
      </p>
    </AdminSurface>
  )
}
