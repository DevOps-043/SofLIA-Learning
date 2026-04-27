'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import {
  CheckCircleIcon,
  CodeBracketIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  EyeIcon,
  EyeSlashIcon,
  FunnelIcon,
  GlobeAltIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  PlusIcon,
  StarIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

import { useAdminTheme } from '../hooks'
import { useAdminApps } from '../hooks/useAdminApps'
import type { AdminApp } from '../services/adminApps.service'
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

const AddAppModal = dynamic(() => import('./AddAppModal').then((mod) => ({ default: mod.AddAppModal })), {
  ssr: false,
})
const EditAppModal = dynamic(() => import('./EditAppModal').then((mod) => ({ default: mod.EditAppModal })), {
  ssr: false,
})
const DeleteAppModal = dynamic(() => import('./DeleteAppModal').then((mod) => ({ default: mod.DeleteAppModal })), {
  ssr: false,
})
const ViewAppModal = dynamic(() => import('./ViewAppModal').then((mod) => ({ default: mod.ViewAppModal })), {
  ssr: false,
})

const statusFilters = ['all', 'active', 'inactive', 'featured', 'verified']

function getPricingKey(model: string) {
  const normalized = model.toLowerCase()
  if (['free', 'freemium', 'paid', 'subscription'].includes(normalized)) return normalized
  return 'custom'
}

export function AdminAppsPage() {
  const {
    apps,
    stats,
    isLoading,
    error,
    refetch,
    createApp,
    updateApp,
    deleteApp,
    toggleAppStatus,
    toggleAppFeatured,
    toggleAppVerified,
  } = useAdminApps()

  const theme = useAdminTheme()
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedApp, setSelectedApp] = useState<AdminApp | null>(null)

  const normalizedSearch = searchTerm.trim().toLowerCase()
  const filteredApps = apps.filter((app) => {
    const matchesSearch =
      !normalizedSearch ||
      app.name.toLowerCase().includes(normalizedSearch) ||
      app.description.toLowerCase().includes(normalizedSearch) ||
      app.tags?.some((tag) => tag.toLowerCase().includes(normalizedSearch))

    const matchesCategory = selectedCategory === 'all' || app.category_id === selectedCategory
    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'active' && app.is_active) ||
      (selectedStatus === 'inactive' && !app.is_active) ||
      (selectedStatus === 'featured' && app.is_featured) ||
      (selectedStatus === 'verified' && app.is_verified)

    return matchesSearch && matchesCategory && matchesStatus
  })

  const handleDeleteApp = async (app: AdminApp) => {
    try {
      setIsProcessing(app.app_id)
      await deleteApp(app.app_id)
      setIsDeleteModalOpen(false)
      setSelectedApp(null)
    } finally {
      setIsProcessing(null)
    }
  }

  const handleSaveNewApp = async (appData: Partial<AdminApp>) => {
    await createApp(appData)
  }

  const handleSaveEditApp = async (appId: string, appData: Partial<AdminApp>) => {
    await updateApp(appId, appData)
  }

  const handleToggleStatus = async (app: AdminApp) => {
    try {
      setIsProcessing(app.app_id)
      await toggleAppStatus(app.app_id, !app.is_active)
    } finally {
      setIsProcessing(null)
    }
  }

  const handleToggleFeatured = async (app: AdminApp) => {
    try {
      setIsProcessing(app.app_id)
      await toggleAppFeatured(app.app_id, !app.is_featured)
    } finally {
      setIsProcessing(null)
    }
  }

  const handleToggleVerified = async (app: AdminApp) => {
    try {
      setIsProcessing(app.app_id)
      await toggleAppVerified(app.app_id, !app.is_verified)
    } finally {
      setIsProcessing(null)
    }
  }

  if (isLoading) {
    return (
      <AdminPageShell maxWidth="wide">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" style={{ color: theme.action }} />
            <p className="text-sm font-medium" style={{ color: theme.textMuted }}>
              {t('apps.page.loading')}
            </p>
          </div>
        </div>
      </AdminPageShell>
    )
  }

  if (error) {
    return (
      <AdminPageShell maxWidth="wide">
        <AdminSurface className="p-6 text-center">
          <p className="text-sm font-medium" style={{ color: theme.danger }}>
            {t('apps.page.loadError', { error })}
          </p>
          <AdminButton className="mt-4" onClick={refetch}>
            {tc('actions.retry')}
          </AdminButton>
        </AdminSurface>
      </AdminPageShell>
    )
  }

  return (
    <AdminPageShell maxWidth="wide">
      <AdminSectionHeader
        size="page"
        title={t('apps.page.title')}
        description={t('apps.page.description')}
        actions={
          <AdminButton onClick={() => setIsAddModalOpen(true)} icon={PlusIcon} size="lg">
            {t('apps.page.add')}
          </AdminButton>
        }
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard icon={ComputerDesktopIcon} label={t('apps.page.stats.total')} tone="primary" value={stats.totalApps} />
        <AdminMetricCard icon={HeartIcon} label={t('apps.page.stats.likes')} tone="info" value={stats.totalLikes.toLocaleString()} />
        <AdminMetricCard icon={EyeIcon} label={t('apps.page.stats.views')} tone="neutral" value={stats.totalViews.toLocaleString()} />
        <AdminMetricCard icon={StarIcon} label={t('apps.page.stats.featured')} tone="primary" value={stats.featuredApps} />
      </div>

      <AdminToolbar>
        <div className="relative flex-1">
          <MagnifyingGlassIcon
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2"
            style={{ color: theme.textMuted }}
          />
          <AdminInput
            className="pl-10"
            placeholder={t('searchPlaceholders.apps')}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto">
          <div className="relative">
            <FunnelIcon
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2"
              style={{ color: theme.textMuted }}
            />
            <AdminSelect className="w-full pl-10 lg:w-56" value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
              <option value="all">{t('apps.page.allCategories')}</option>
            </AdminSelect>
          </div>
          <AdminSelect className="w-full lg:w-52" value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)}>
            {statusFilters.map((status) => (
              <option key={status} value={status}>
                {t(`apps.page.filters.${status}`)}
              </option>
            ))}
          </AdminSelect>
        </div>
      </AdminToolbar>

      {filteredApps.length === 0 ? (
        <AdminSurface className="px-6 py-12 text-center">
          <ComputerDesktopIcon className="mx-auto h-12 w-12" style={{ color: theme.textMuted }} />
          <p className="mt-4 text-sm font-medium" style={{ color: theme.textMuted }}>
            {t('apps.page.empty')}
          </p>
        </AdminSurface>
      ) : (
        <div className="space-y-4">
          {filteredApps.map((app) => (
            <AdminSurface key={app.app_id} className="p-5" interactive>
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <AdminStatusBadge tone={app.is_active ? 'primary' : 'neutral'}>
                      {app.is_active ? t('apps.page.status.active') : t('apps.page.status.inactive')}
                    </AdminStatusBadge>
                    {app.is_featured ? <AdminStatusBadge tone="warning">{t('apps.page.status.featured')}</AdminStatusBadge> : null}
                    {app.is_verified ? <AdminStatusBadge tone="primary">{t('apps.page.status.verified')}</AdminStatusBadge> : null}
                    <AdminStatusBadge tone="neutral">
                      {getPricingKey(app.pricing_model) === 'custom'
                        ? app.pricing_model
                        : t(`apps.page.pricing.${getPricingKey(app.pricing_model)}`)}
                    </AdminStatusBadge>
                  </div>

                  <div className="flex min-w-0 gap-4">
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border"
                      style={{ backgroundColor: theme.actionSurface, borderColor: theme.border, color: theme.action }}
                    >
                      {app.logo_url ? (
                        <img src={app.logo_url} alt="" className="h-full w-full rounded-2xl object-contain p-2" />
                      ) : (
                        <ComputerDesktopIcon className="h-7 w-7" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-xl font-bold" style={{ color: theme.text }}>
                        {app.name}
                      </h2>
                      <p className="mt-2 line-clamp-2 text-sm leading-6" style={{ color: theme.textMuted }}>
                        {app.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {app.features?.length ? (
                      app.features.slice(0, 4).map((feature) => (
                        <span key={feature} className="rounded-full border px-3 py-1 text-xs font-medium" style={{ borderColor: theme.border, color: theme.textMuted }}>
                          {feature}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm" style={{ color: theme.textMuted }}>
                        {t('apps.page.noFeatures')}
                      </span>
                    )}
                    {app.features?.length > 4 ? (
                      <span className="rounded-full border px-3 py-1 text-xs font-medium" style={{ borderColor: theme.border, color: theme.textMuted }}>
                        +{app.features.length - 4}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm" style={{ color: theme.textMuted }}>
                    <span>{app.ai_categories?.name || t('apps.page.uncategorized')}</span>
                    <span>{new Date(app.created_at).toLocaleDateString()}</span>
                    {app.api_available ? <span className="inline-flex items-center gap-1"><CodeBracketIcon className="h-4 w-4" />API</span> : null}
                    {app.mobile_app ? <span className="inline-flex items-center gap-1"><DevicePhoneMobileIcon className="h-4 w-4" />{t('apps.page.platform.mobile')}</span> : null}
                    {app.desktop_app ? <span className="inline-flex items-center gap-1"><ComputerDesktopIcon className="h-4 w-4" />Desktop</span> : null}
                    {app.browser_extension ? <span className="inline-flex items-center gap-1"><GlobeAltIcon className="h-4 w-4" />{t('apps.page.platform.extension')}</span> : null}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-4 xl:items-end">
                  <div className="flex items-center gap-4 text-sm" style={{ color: theme.textMuted }}>
                    <span className="inline-flex items-center gap-1"><HeartIcon className="h-4 w-4" />{app.like_count}</span>
                    <span className="inline-flex items-center gap-1"><EyeIcon className="h-4 w-4" />{app.view_count}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                    <AdminIconButton
                      label={app.is_active ? t('apps.page.actions.deactivate') : t('apps.page.actions.activate')}
                      onClick={() => handleToggleStatus(app)}
                      disabled={isProcessing === app.app_id}
                      icon={EyeSlashIcon}
                    />
                    <AdminIconButton
                      label={app.is_featured ? t('apps.page.actions.unfeature') : t('apps.page.actions.feature')}
                      onClick={() => handleToggleFeatured(app)}
                      disabled={isProcessing === app.app_id}
                      icon={StarIcon}
                      tone="warning"
                    />
                    <AdminIconButton
                      label={app.is_verified ? t('apps.page.actions.unverify') : t('apps.page.actions.verify')}
                      onClick={() => handleToggleVerified(app)}
                      disabled={isProcessing === app.app_id}
                      icon={CheckCircleIcon}
                    />
                    <AdminIconButton
                      label={tc('actions.viewDetails')}
                      onClick={() => {
                        setSelectedApp(app)
                        setIsViewModalOpen(true)
                      }}
                      icon={EyeIcon}
                      tone="neutral"
                    />
                    <AdminIconButton
                      label={tc('actions.edit')}
                      onClick={() => {
                        setSelectedApp(app)
                        setIsEditModalOpen(true)
                      }}
                      icon={PencilIcon}
                    />
                    <AdminIconButton
                      label={tc('actions.delete')}
                      onClick={() => {
                        setSelectedApp(app)
                        setIsDeleteModalOpen(true)
                      }}
                      icon={TrashIcon}
                      tone="danger"
                    />
                  </div>
                </div>
              </div>
            </AdminSurface>
          ))}
        </div>
      )}

      <AddAppModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSave={handleSaveNewApp} />
      <EditAppModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedApp(null)
        }}
        onSave={handleSaveEditApp}
        app={selectedApp}
      />
      <DeleteAppModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setSelectedApp(null)
        }}
        onConfirm={handleDeleteApp}
        app={selectedApp}
        isDeleting={isProcessing === selectedApp?.app_id}
      />
      <ViewAppModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedApp(null)
        }}
        app={selectedApp}
      />
    </AdminPageShell>
  )
}
