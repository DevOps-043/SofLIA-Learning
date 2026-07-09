'use client'

import Image from 'next/image'
import { Building2, Eye, Mail } from 'lucide-react'
import { motion } from 'framer-motion'
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

interface AdminCompanyListRowProps {
  company: AdminCompany
  onView: () => void
  themeColors: AdminCompaniesThemeColors
  index: number
}

export function AdminCompanyListRow({ company, onView, themeColors, index }: AdminCompanyListRowProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()
  const usagePercent = getCompanyUsagePercent(company)
  const status = getAdminCompanyStatusDisplayConfig(company, theme)
  const normalizedPlan = getAdminCompanyPlanKey(company.subscription_plan)
  const planColor = getAdminCompanyPlanColor(company.subscription_plan, theme)
  const logoUrl = company.brand_logo_url || company.logo_url
  const usageColor = getAdminCompanyUsageColor(usagePercent, theme)
  const StatusIcon = status.icon

  return (
    <motion.article
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ scale: 1.003 }}
      className="group flex items-center gap-4 rounded-2xl border p-4 shadow-sm transition-shadow hover:shadow-lg"
      style={{
        backgroundColor: themeColors.cardBackground,
        borderColor: themeColors.borderColor,
        boxShadow: theme.isDark
          ? '0 4px 12px -6px rgba(0,0,0,0.5)'
          : '0 2px 8px -4px rgba(15,23,42,0.08)',
      }}
    >
      {/* Logo */}
      <div
        className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-white shadow-sm"
        style={{ borderColor: theme.borderColor, color: theme.primaryColor }}
      >
        {logoUrl ? (
          <Image src={logoUrl} alt={company.name} fill sizes="48px" className="object-contain p-1.5" unoptimized />
        ) : (
          <Building2 className="h-6 w-6" />
        )}
      </div>

      {/* Name & Slug */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3
            className="truncate text-sm font-extrabold"
            style={{ color: themeColors.textPrimary }}
            title={company.name}
          >
            {company.name}
          </h3>
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-extrabold"
            style={{
              backgroundColor: status.bg,
              borderColor: status.border,
              color: status.color,
            }}
          >
            <StatusIcon className="h-3 w-3" />
            {t(`companies.status.${status.key}`)}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs font-semibold" style={{ color: themeColors.textSecondary }}>
          {company.slug || t('companies.card.noSlug')}
        </p>
      </div>

      {/* Plan Badge */}
      <div className="hidden shrink-0 sm:block">
        <span
          className="rounded-lg border px-2.5 py-1 text-[11px] font-extrabold"
          style={{
            backgroundColor: `color-mix(in srgb, ${planColor} 7.8%, transparent)`,
            borderColor: `color-mix(in srgb, ${planColor} 14.9%, transparent)`,
            color: planColor,
          }}
        >
          {t('companies.card.plan', {
            plan: t(`companies.plans.${normalizedPlan}`, {
              defaultValue: company.subscription_plan || t('companies.plans.none'),
            }),
          })}
        </span>
      </div>

      {/* Contact Email */}
      <div className="hidden shrink-0 lg:block">
        {company.contact_email ? (
          <span
            className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold"
            style={{
              backgroundColor: theme.inputBg,
              borderColor: theme.borderColor,
              color: theme.subtextColor,
            }}
            title={company.contact_email}
          >
            <Mail className="h-3 w-3 shrink-0" />
            <span className="max-w-[140px] truncate">{company.contact_email}</span>
          </span>
        ) : null}
      </div>

      {/* Metrics */}
      <div className="hidden shrink-0 items-center gap-3 xl:flex">
        <div className="text-center">
          <p className="text-sm font-extrabold" style={{ color: themeColors.textPrimary }}>
            {company.active_users}
          </p>
          <p className="text-[10px] font-bold" style={{ color: themeColors.textSecondary }}>
            {t('companies.card.activeUsers')}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm font-extrabold" style={{ color: themeColors.textPrimary }}>
            {company.total_users}
          </p>
          <p className="text-[10px] font-bold" style={{ color: themeColors.textSecondary }}>
            {t('companies.card.totalUsers')}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm font-extrabold" style={{ color: usageColor }}>
            {usagePercent}%
          </p>
          <p className="text-[10px] font-bold" style={{ color: themeColors.textSecondary }}>
            {t('companies.card.usage')}
          </p>
        </div>
      </div>

      {/* Usage Bar */}
      <div className="hidden w-24 shrink-0 xl:block">
        <div className="mb-1 flex justify-between text-[10px] font-bold" style={{ color: themeColors.textSecondary }}>
          <span>{t('companies.card.licenseUsage')}</span>
          <span>
            {company.active_users} / {company.max_users || '∞'}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: theme.hoverBg }}>
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: usageColor }}
            initial={{ width: 0 }}
            animate={{ width: `${usagePercent}%` }}
            transition={{ duration: 0.6, delay: 0.1 }}
          />
        </div>
      </div>

      {/* View Action */}
      <button
        type="button"
        onClick={onView}
        className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-xs font-extrabold uppercase tracking-wider transition-all hover:scale-105"
        style={{
          backgroundColor: theme.inputBg,
          borderColor: theme.borderColor,
          color: theme.textColor,
        }}
      >
        <Eye className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{t('companies.actions.view')}</span>
      </button>
    </motion.article>
  )
}
