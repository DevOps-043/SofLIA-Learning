'use client'

import {
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  HeartIcon,
  StarIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

import { useAdminTheme } from '../hooks/useAdminTheme'
import { AdminButton, AdminMetricCard, AdminModalShell, AdminStatusBadge, AdminSurface } from './ui'
import { AdminApp } from '../services/adminApps.service'

interface ViewAppModalProps {
  isOpen: boolean
  onClose: () => void
  app: AdminApp | null
}

function pricingTone(model: string) {
  switch (model.toLowerCase()) {
    case 'paid':
      return 'danger' as const
    case 'subscription':
      return 'warning' as const
    case 'free':
    case 'freemium':
      return 'info' as const
    default:
      return 'neutral' as const
  }
}

function SectionTitle({ children }: { children: string }) {
  const theme = useAdminTheme()

  return (
    <h4 className="mb-3 text-base font-bold" style={{ color: theme.text }}>
      {children}
    </h4>
  )
}

function TokenList({ values }: { values: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value, index) => (
        <AdminStatusBadge key={`${value}-${index}`} tone="neutral">
          {value}
        </AdminStatusBadge>
      ))}
    </div>
  )
}

function PlatformAvailability({ enabled, label }: { enabled: boolean; label: string }) {
  const theme = useAdminTheme()
  const Icon = enabled ? CheckCircleIcon : XCircleIcon

  return (
    <div className="flex items-center gap-2 rounded-xl border px-3 py-2" style={{ borderColor: theme.border }}>
      <Icon className="h-5 w-5" style={{ color: enabled ? theme.action : theme.textMuted }} />
      <span className="text-sm" style={{ color: theme.text }}>
        {label}
      </span>
    </div>
  )
}

export function ViewAppModal({ isOpen, onClose, app }: ViewAppModalProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()

  if (!isOpen || !app) return null

  const pricingLabel = t(`viewAppModal.pricing.${app.pricing_model.toLowerCase()}`, {
    defaultValue: app.pricing_model,
  })

  return (
    <AdminModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={t('viewAppModal.title')}
      description={app.name}
      icon={StarIcon}
      className="max-w-5xl"
      footer={
        <div className="flex justify-end">
          <AdminButton variant="secondary" onClick={onClose}>
            {t('viewAppModal.close')}
          </AdminButton>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border"
            style={{ backgroundColor: theme.surfaceSubtle, borderColor: theme.border }}
          >
            {app.logo_url ? (
              <img src={app.logo_url} alt="" className="h-full w-full object-contain" />
            ) : (
              <span className="text-2xl font-black" style={{ color: theme.action }}>
                {app.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h3 className="text-2xl font-bold" style={{ color: theme.text }}>
                {app.name}
              </h3>
              <AdminStatusBadge tone={pricingTone(app.pricing_model)}>{pricingLabel}</AdminStatusBadge>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2 text-sm" style={{ color: theme.textMuted }}>
              <span>{t('viewAppModal.category', { category: app.ai_categories?.name || t('viewAppModal.noCategory') })}</span>
              <span>/</span>
              <span>{t('viewAppModal.created', { date: new Date(app.created_at).toLocaleDateString(undefined) })}</span>
              <span>/</span>
              <span>{t('viewAppModal.updated', { date: new Date(app.updated_at).toLocaleDateString(undefined) })}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <AdminStatusBadge tone={app.is_active ? 'info' : 'neutral'}>
                {app.is_active ? t('viewAppModal.active') : t('viewAppModal.inactive')}
              </AdminStatusBadge>
              {app.is_featured ? <AdminStatusBadge tone="warning">{t('viewAppModal.featured')}</AdminStatusBadge> : null}
              {app.is_verified ? <AdminStatusBadge tone="primary">{t('viewAppModal.verified')}</AdminStatusBadge> : null}
            </div>
          </div>
        </div>

        <div>
          <SectionTitle>{t('viewAppModal.description')}</SectionTitle>
          <p className="text-sm leading-6" style={{ color: theme.textMuted }}>
            {app.description}
          </p>
          {app.long_description ? (
            <div className="mt-4">
              <SectionTitle>{t('viewAppModal.longDescription')}</SectionTitle>
              <p className="text-sm leading-6" style={{ color: theme.textMuted }}>
                {app.long_description}
              </p>
            </div>
          ) : null}
        </div>

        {app.website_url || app.logo_url ? (
          <div>
            <SectionTitle>{t('viewAppModal.links')}</SectionTitle>
            <div className="space-y-2">
              {app.website_url ? (
                <ExternalLink href={app.website_url} label={t('viewAppModal.website')} />
              ) : null}
              {app.logo_url ? <ExternalLink href={app.logo_url} label={t('viewAppModal.logo')} /> : null}
            </div>
          </div>
        ) : null}

        {app.features && app.features.length > 0 ? (
          <div>
            <SectionTitle>{t('viewAppModal.features')}</SectionTitle>
            <TokenList values={app.features} />
          </div>
        ) : null}

        {app.use_cases && app.use_cases.length > 0 ? (
          <div>
            <SectionTitle>{t('viewAppModal.useCases')}</SectionTitle>
            <TokenList values={app.use_cases} />
          </div>
        ) : null}

        <div>
          <SectionTitle>{t('viewAppModal.platforms')}</SectionTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <PlatformAvailability enabled={app.api_available} label={t('viewAppModal.platform.api')} />
            <PlatformAvailability enabled={app.mobile_app} label={t('viewAppModal.platform.mobile')} />
            <PlatformAvailability enabled={app.desktop_app} label={t('viewAppModal.platform.desktop')} />
            <PlatformAvailability enabled={app.browser_extension} label={t('viewAppModal.platform.extension')} />
          </div>
        </div>

        <div>
          <SectionTitle>{t('viewAppModal.stats')}</SectionTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <AdminMetricCard label={t('viewAppModal.stat.views')} value={app.view_count.toLocaleString()} />
            <AdminMetricCard icon={HeartIcon} label={t('viewAppModal.stat.likes')} value={app.like_count.toLocaleString()} tone="danger" />
            <AdminMetricCard icon={StarIcon} label={t('viewAppModal.stat.rating')} value={app.rating.toFixed(1)} tone="warning" />
            <AdminMetricCard label={t('viewAppModal.stat.reviews')} value={app.rating_count.toLocaleString()} tone="neutral" />
          </div>
        </div>

        {app.tags && app.tags.length > 0 ? (
          <div>
            <SectionTitle>{t('viewAppModal.tags')}</SectionTitle>
            <TokenList values={app.tags.map((tag) => `#${tag}`)} />
          </div>
        ) : null}
      </div>
    </AdminModalShell>
  )
}

function ExternalLink({ href, label }: { href: string; label: string }) {
  const theme = useAdminTheme()

  return (
    <AdminSurface className="p-3" style={{ boxShadow: 'none' }}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-sm font-semibold transition hover:opacity-80"
        style={{ color: theme.action }}
      >
        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
        {label}
      </a>
    </AdminSurface>
  )
}
