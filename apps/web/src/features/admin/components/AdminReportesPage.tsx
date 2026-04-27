'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  PhotoIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

import { useAdminReportes } from '../hooks/useAdminReportes'
import { useAdminTheme } from '../hooks/useAdminTheme'
import type { AdminReporte } from '../services/adminReportes.service'
import {
  AdminButton,
  AdminIconButton,
  AdminInput,
  AdminMetricCard,
  AdminPageShell,
  AdminSectionHeader,
  AdminSelect,
  AdminStatusBadge,
  AdminSurface,
  AdminToolbar,
} from './ui'

const ViewReporteModal = dynamic(() => import('./ViewReporteModal').then((mod) => ({ default: mod.ViewReporteModal })), {
  ssr: false,
})

const EditReporteModal = dynamic(() => import('./EditReporteModal').then((mod) => ({ default: mod.EditReporteModal })), {
  ssr: false,
})

export function AdminReportesPage() {
  const {
    reportes,
    stats,
    isLoading,
    error,
    refetch,
    updateReporte,
    applyFilters,
  } = useAdminReportes()

  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const theme = useAdminTheme()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEstado, setSelectedEstado] = useState('all')
  const [selectedCategoria, setSelectedCategoria] = useState('all')
  const [selectedPrioridad, setSelectedPrioridad] = useState('all')
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedReporte, setSelectedReporte] = useState<AdminReporte | null>(null)

  const statusOptions = [
    { value: 'all', label: t('reportsPage.filters.allStatuses') },
    { value: 'pendiente', label: t('reportsPage.status.pending') },
    { value: 'en_revision', label: t('reportsPage.status.inReview') },
    { value: 'en_progreso', label: t('reportsPage.status.inProgress') },
    { value: 'resuelto', label: t('reportsPage.status.resolved') },
    { value: 'rechazado', label: t('reportsPage.status.rejected') },
    { value: 'duplicado', label: t('reportsPage.status.duplicated') },
  ]

  const categoryOptions = [
    { value: 'all', label: t('reportsPage.filters.allCategories') },
    { value: 'bug', label: t('reportsPage.categories.bug') },
    { value: 'sugerencia', label: t('reportsPage.categories.suggestion') },
    { value: 'contenido', label: t('reportsPage.categories.content') },
    { value: 'performance', label: t('reportsPage.categories.performance') },
    { value: 'ui-ux', label: t('reportsPage.categories.uiux') },
    { value: 'otro', label: t('reportsPage.categories.other') },
  ]

  const priorityOptions = [
    { value: 'all', label: t('reportsPage.filters.allPriorities') },
    { value: 'critica', label: t('reportsPage.priorities.critical') },
    { value: 'alta', label: t('reportsPage.priorities.high') },
    { value: 'media', label: t('reportsPage.priorities.medium') },
    { value: 'baja', label: t('reportsPage.priorities.low') },
  ]

  const handleApplyFilters = () => {
    applyFilters({
      estado: selectedEstado !== 'all' ? selectedEstado : undefined,
      categoria: selectedCategoria !== 'all' ? selectedCategoria : undefined,
      prioridad: selectedPrioridad !== 'all' ? selectedPrioridad : undefined,
      search: searchTerm || undefined,
    })
  }

  const handleResetFilters = () => {
    setSearchTerm('')
    setSelectedEstado('all')
    setSelectedCategoria('all')
    setSelectedPrioridad('all')
    applyFilters({})
  }

  const handleViewReporte = (reporte: AdminReporte) => {
    setSelectedReporte(reporte)
    setIsViewModalOpen(true)
  }

  const handleEditReporte = (reporte: AdminReporte) => {
    setSelectedReporte(reporte)
    setIsEditModalOpen(true)
  }

  const handleUpdateReporte = async (
    reporteId: string,
    updates: {
      estado?: AdminReporte['estado']
      admin_asignado?: string
      notas_admin?: string
      prioridad?: AdminReporte['prioridad']
    },
  ) => {
    try {
      setIsProcessing(reporteId)
      await updateReporte(reporteId, updates)
      setIsEditModalOpen(false)
      setSelectedReporte(null)
    } finally {
      setIsProcessing(null)
    }
  }

  const getEstadoTone = (estado: string | null) => {
    switch (estado) {
      case 'pendiente':
        return 'warning' as const
      case 'en_revision':
      case 'en_progreso':
        return 'primary' as const
      case 'resuelto':
        return 'info' as const
      case 'rechazado':
      case 'duplicado':
        return 'danger' as const
      default:
        return 'neutral' as const
    }
  }

  const getPrioridadTone = (prioridad?: string | null) => {
    switch (prioridad) {
      case 'critica':
        return 'danger' as const
      case 'alta':
      case 'media':
        return 'warning' as const
      case 'baja':
        return 'neutral' as const
      default:
        return 'neutral' as const
    }
  }

  const getCategoriaLabel = (categoria: string) =>
    categoryOptions.find((item) => item.value === categoria)?.label || categoria

  const getEstadoLabel = (estado: string | null) =>
    statusOptions.find((item) => item.value === estado)?.label || t('reportsPage.status.unknown')

  const getPrioridadLabel = (prioridad?: string | null) =>
    priorityOptions.find((item) => item.value === prioridad)?.label || t('reportsPage.priorities.medium')

  if (isLoading) {
    return (
      <AdminPageShell maxWidth="content">
        <div className="flex min-h-[240px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-transparent" style={{ borderBottomColor: theme.action }} />
            <p className="text-sm" style={{ color: theme.textMuted }}>{t('reportsPage.loading')}</p>
          </div>
        </div>
      </AdminPageShell>
    )
  }

  if (error) {
    return (
      <AdminPageShell maxWidth="content">
        <AdminSurface className="p-8 text-center">
          <p className="mb-4 text-sm" style={{ color: theme.danger }}>{t('reportsPage.error', { error })}</p>
          <AdminButton onClick={refetch}>{tc('actions.retry')}</AdminButton>
        </AdminSurface>
      </AdminPageShell>
    )
  }

  return (
    <AdminPageShell maxWidth="content">
      <div className="space-y-7">
        <AdminSectionHeader
          size="page"
          icon={ExclamationTriangleIcon}
          kicker={t('navigation.reports')}
          title={t('reportsPage.title')}
          description={t('reportsPage.description')}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AdminMetricCard label={t('reportsPage.stats.total')} value={stats.total} icon={ExclamationTriangleIcon} tone="primary" />
          <AdminMetricCard label={t('reportsPage.stats.pending')} value={stats.pendientes} icon={ClockIcon} tone="warning" />
          <AdminMetricCard label={t('reportsPage.stats.inProgress')} value={stats.en_progreso + stats.en_revision} icon={PencilIcon} tone="primary" />
          <AdminMetricCard label={t('reportsPage.stats.resolved')} value={stats.resueltos} icon={CheckCircleIcon} tone="info" />
        </div>

        <AdminToolbar>
          <div className="relative min-w-0 flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: theme.textMuted }} />
            <AdminInput
              type="text"
              placeholder={t('searchPlaceholders.reportes')}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <AdminSelect value={selectedEstado} onChange={(event) => setSelectedEstado(event.target.value)} className="min-w-[170px]">
              {statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </AdminSelect>
            <AdminSelect value={selectedCategoria} onChange={(event) => setSelectedCategoria(event.target.value)} className="min-w-[170px]">
              {categoryOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </AdminSelect>
            <AdminSelect value={selectedPrioridad} onChange={(event) => setSelectedPrioridad(event.target.value)} className="min-w-[170px]">
              {priorityOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </AdminSelect>
            <AdminButton onClick={handleApplyFilters}>{t('reportsPage.filters.apply')}</AdminButton>
            <AdminButton onClick={handleResetFilters} variant="secondary">{t('reportsPage.filters.clear')}</AdminButton>
          </div>
        </AdminToolbar>

        {reportes.length === 0 ? (
          <AdminSurface className="border-dashed p-10 text-center">
            <ExclamationTriangleIcon className="mx-auto mb-4 h-12 w-12" style={{ color: theme.textMuted }} />
            <h3 className="text-lg font-bold" style={{ color: theme.text }}>{t('reportsPage.emptyTitle')}</h3>
            <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>{t('reportsPage.emptyDescription')}</p>
          </AdminSurface>
        ) : (
          <AdminSurface className="overflow-hidden">
            <div className="divide-y" style={{ borderColor: theme.divider }}>
              {reportes.map((reporte) => (
                <article
                  key={reporte.id}
                  className="p-5 transition"
                  style={{ borderColor: theme.divider }}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <h3 className="min-w-0 text-lg font-bold" style={{ color: theme.text }}>
                          {reporte.titulo}
                        </h3>
                        <AdminStatusBadge tone={getPrioridadTone(reporte.prioridad)}>
                          {getPrioridadLabel(reporte.prioridad)}
                        </AdminStatusBadge>
                        <AdminStatusBadge tone={getEstadoTone(reporte.estado)}>
                          {getEstadoLabel(reporte.estado)}
                        </AdminStatusBadge>
                      </div>

                      <p className="mb-4 line-clamp-2 text-sm leading-6" style={{ color: theme.textMuted }}>
                        {reporte.descripcion}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs font-medium" style={{ color: theme.textMuted }}>
                        <span className="rounded-lg border px-2.5 py-1" style={{ borderColor: theme.border, backgroundColor: theme.surfaceSubtle }}>
                          <span style={{ color: theme.text }}>{t('reportsPage.categoryLabel')} </span>
                          {getCategoriaLabel(reporte.categoria)}
                        </span>
                        {reporte.usuario ? (
                          <span className="flex items-center gap-1.5">
                            <UserIcon className="h-4 w-4" />
                            {reporte.usuario.display_name || reporte.usuario.username}
                          </span>
                        ) : null}
                        {reporte.created_at ? (
                          <span className="flex items-center gap-1.5">
                            <ClockIcon className="h-4 w-4" />
                            {new Date(reporte.created_at).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        ) : null}
                        {reporte.screenshot_url ? (
                          <span className="flex items-center gap-1.5" style={{ color: theme.action }}>
                            <PhotoIcon className="h-4 w-4" />
                            {t('reportsPage.withImage')}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 lg:ml-6">
                      <AdminIconButton
                        icon={EyeIcon}
                        label={tc('actions.viewDetails')}
                        onClick={() => handleViewReporte(reporte)}
                        tone="primary"
                      />
                      <AdminIconButton
                        icon={PencilIcon}
                        label={tc('actions.edit')}
                        onClick={() => handleEditReporte(reporte)}
                        tone="primary"
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </AdminSurface>
        )}
      </div>

      {isViewModalOpen && selectedReporte ? (
        <ViewReporteModal
          reporte={selectedReporte}
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false)
            setSelectedReporte(null)
          }}
          onEdit={() => {
            setIsViewModalOpen(false)
            setIsEditModalOpen(true)
          }}
        />
      ) : null}

      {isEditModalOpen && selectedReporte ? (
        <EditReporteModal
          reporte={selectedReporte}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedReporte(null)
          }}
          onSave={handleUpdateReporte}
          isProcessing={isProcessing === selectedReporte.id}
        />
      ) : null}
    </AdminPageShell>
  )
}
