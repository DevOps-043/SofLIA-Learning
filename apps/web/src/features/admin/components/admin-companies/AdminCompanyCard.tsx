'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  Building2,
  CheckCircle2,
  Eye,
  Mail,
  PauseCircle,
  Pencil,
  RefreshCw,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import type { AdminCompany } from '../../types/admin-companies.types'
import {
  getAdminCompanyPlanColor,
  getAdminCompanyPlanKey,
  getAdminCompanyStatusDisplayConfig,
  getAdminCompanyUsageColor,
  getCompanyUsagePercent,
  type AdminCompaniesThemeColors,
} from '../../services/admin-companies'

interface AdminCompanyCardProps {
  company: AdminCompany
  onView: () => void
  onEdit: () => void
  onToggle: () => void
  onActivate?: () => void
  isUpdating: boolean
  themeColors: AdminCompaniesThemeColors
}

export function AdminCompanyCard({
  company,
  onView,
  onEdit,
  onToggle,
  onActivate,
  isUpdating,
  themeColors,
}: AdminCompanyCardProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()
  const usagePercent = getCompanyUsagePercent(company)
  const status = getAdminCompanyStatusDisplayConfig(company, theme)
  const StatusIcon = status.icon
  const normalizedPlan = getAdminCompanyPlanKey(company.subscription_plan)
  const planColor = getAdminCompanyPlanColor(company.subscription_plan, theme)
  const logoUrl = company.brand_logo_url || company.logo_url
  const usageColor = getAdminCompanyUsageColor(usagePercent, theme)
  const shouldShowActivate =
    company.subscription_status?.toLowerCase() === 'pending' && !company.is_active && onActivate

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      className="group relative flex min-h-[360px] flex-col overflow-hidden rounded-[24px] border shadow-sm transition-shadow hover:shadow-xl"
      style={{
        backgroundColor: themeColors.cardBackground,
        borderColor: themeColors.borderColor,
        boxShadow: theme.isDark
          ? '0 18px 40px -24px rgba(0,0,0,0.75)'
          : '0 16px 36px -28px rgba(15,23,42,0.18)',
      }}
    >
      <div
        className="relative border-b px-6 py-5"
        style={{
          borderColor: themeColors.borderColor,
          background: `linear-gradient(135deg, ${theme.inputBg}, ${theme.hoverBg})`,
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div
              className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border shadow-sm"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.borderColor,
                color: theme.primaryColor,
              }}
            >
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={company.name}
                  fill
                  sizes="64px"
                  className="object-contain p-2"
                  unoptimized
                />
              ) : (
                <Building2 className="h-8 w-8" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-lg font-extrabold" style={{ color: themeColors.textPrimary }} title={company.name}>
                {company.name}
              </h3>
              <p className="mt-1 truncate text-sm font-semibold" style={{ color: themeColors.textSecondary }}>
                {company.slug || t('companies.card.noSlug')}
              </p>
            </div>
          </div>

          <span
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-extrabold"
            style={{
              backgroundColor: status.bg,
              borderColor: status.border,
              color: status.color,
            }}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            {t(`companies.status.${status.key}`)}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span
            className="rounded-xl border px-3 py-1.5 text-xs font-extrabold"
            style={{
              backgroundColor: `${planColor}14`,
              borderColor: `${planColor}26`,
              color: planColor,
            }}
          >
            {t('companies.card.plan', {
              plan: t(`companies.plans.${normalizedPlan}`, {
                defaultValue: company.subscription_plan || t('companies.plans.none'),
              }),
            })}
          </span>
          {company.contact_email ? (
            <span
              className="flex min-w-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold"
              style={{
                backgroundColor: theme.inputBg,
                borderColor: theme.borderColor,
                color: theme.subtextColor,
              }}
              title={company.contact_email}
            >
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="max-w-[150px] truncate">{company.contact_email}</span>
            </span>
          ) : null}
        </div>

        <div className="mb-5 grid grid-cols-3 gap-3">
          <Metric
            label={t('companies.card.activeUsers')}
            value={company.active_users}
            color={themeColors.textPrimary}
            themeColors={themeColors}
          />
          <Metric
            label={t('companies.card.totalUsers')}
            value={company.total_users}
            color={themeColors.textPrimary}
            themeColors={themeColors}
          />
          <Metric
            label={t('companies.card.usage')}
            value={`${usagePercent}%`}
            color={usageColor}
            themeColors={themeColors}
          />
        </div>

        <div className="mb-6">
          <div className="mb-2 flex justify-between gap-3 text-xs font-bold" style={{ color: themeColors.textSecondary }}>
            <span>{t('companies.card.licenseUsage')}</span>
            <span>
              {company.active_users} / {company.max_users || t('companies.card.unlimited')}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: theme.hoverBg }}>
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: usageColor }}
              initial={{ width: 0 }}
              animate={{ width: `${usagePercent}%` }}
              transition={{ duration: 0.8, delay: 0.15 }}
            />
          </div>
        </div>

        <div className="mt-auto flex items-center gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onView()
            }}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border px-4 text-xs font-extrabold uppercase tracking-wider transition-all"
            style={{
              backgroundColor: theme.inputBg,
              borderColor: theme.borderColor,
              color: theme.textColor,
            }}
          >
            <Eye className="h-4 w-4" />
            {t('companies.actions.view')}
          </button>

          {shouldShowActivate ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onActivate?.()
              }}
              disabled={isUpdating}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl px-4 text-xs font-extrabold uppercase tracking-wider transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                backgroundColor: `${theme.successColor}14`,
                color: theme.successColor,
              }}
            >
              {isUpdating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {t('companies.actions.activate')}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onEdit()
                }}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl px-4 text-xs font-extrabold uppercase tracking-wider transition-all"
                style={{
                  backgroundColor: `${theme.primaryColor}14`,
                  color: theme.primaryColor,
                }}
              >
                <Pencil className="h-4 w-4" />
                {t('companies.actions.edit')}
              </button>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onToggle()
                }}
                disabled={isUpdating}
                className="flex h-11 w-12 items-center justify-center rounded-2xl transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  backgroundColor: company.is_active
                    ? `${theme.warningColor}14`
                    : `${theme.successColor}14`,
                  color: company.is_active ? theme.warningColor : theme.successColor,
                }}
                aria-label={
                  company.is_active
                    ? t('companies.actions.pause')
                    : t('companies.actions.activate')
                }
                title={
                  company.is_active
                    ? t('companies.actions.pause')
                    : t('companies.actions.activate')
                }
              >
                {isUpdating ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : company.is_active ? (
                  <PauseCircle className="h-4 w-4" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </motion.article>
  )
}

function Metric({
  label,
  value,
  color,
  themeColors,
}: {
  label: string
  value: number | string
  color: string
  themeColors: AdminCompaniesThemeColors
}) {
  return (
    <div className="rounded-2xl p-3 text-center" style={{ backgroundColor: themeColors.inputBg }}>
      <p className="text-lg font-extrabold" style={{ color }}>
        {value}
      </p>
      <p className="text-xs font-bold" style={{ color: themeColors.textSecondary }}>
        {label}
      </p>
    </div>
  )
}
