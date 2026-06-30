'use client'

import Image from 'next/image'
import type { LucideIcon } from 'lucide-react'
import { Building2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import type { AdminCompany } from '../../types/admin-companies.types'
import type { AdminCompaniesThemeColors } from '../../services/admin-companies'

interface AdminCompanyViewModalHeaderProps {
  company: AdminCompany
  logoUrl: string | null
  status: {
    icon: LucideIcon
    bg: string
    color: string
    key: string
  }
  planColor: string
  normalizedPlan: string
  themeColors: AdminCompaniesThemeColors
  onClose: () => void
}

export function AdminCompanyViewModalHeader(props: AdminCompanyViewModalHeaderProps) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const theme = useAdminPanelTheme()
  const StatusIcon = props.status.icon
  return (
    <>
      <div className="relative h-44 border-b" style={{ backgroundColor: props.themeColors.inputBg, backgroundImage: props.company.brand_banner_url ? `url(${props.company.brand_banner_url})` : theme.heroBackground, backgroundSize: 'cover', backgroundPosition: 'center', borderColor: props.themeColors.borderColor }}>
        {!props.company.brand_banner_url ? <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, ${theme.inverseTextColor} 1px, transparent 0)`, backgroundSize: '32px 32px' }} /> : null}
        <button type="button" onClick={props.onClose} className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl border backdrop-blur-xl" style={{ backgroundColor: theme.inverseSurface, borderColor: theme.inverseBorderColor, color: theme.inverseTextColor }} aria-label={tc('actions.close')}>
          <X className="h-5 w-5" />
        </button>
        <div className="absolute -bottom-12 left-6">
          <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-[24px] border-4 bg-white shadow-lg" style={{ borderColor: props.themeColors.cardBackground, color: theme.primaryColor }}>
            {props.logoUrl ? <Image src={props.logoUrl} alt={props.company.name} fill sizes="96px" className="object-contain p-3" unoptimized /> : <Building2 className="h-12 w-12" />}
          </div>
        </div>
      </div>
      <div className="px-6 pb-6 pt-16">
        <div className="min-w-0">
          <h2 className="truncate text-2xl font-extrabold" style={{ color: props.themeColors.textPrimary }}>{props.company.name}</h2>
          <p className="mt-1 text-sm font-semibold" style={{ color: props.themeColors.textSecondary }}>/ {props.company.slug || t('companies.card.noSlug')}</p>
          {props.company.description ? <p className="mt-3 max-w-2xl text-sm leading-relaxed" style={{ color: props.themeColors.textSecondary }}>{props.company.description}</p> : null}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-extrabold" style={{ backgroundColor: props.status.bg, borderColor: `color-mix(in srgb, ${props.status.color} 14.9%, transparent)`, color: props.status.color }}>
            <StatusIcon className="h-3.5 w-3.5" />
            {t(`companies.status.${props.status.key}`)}
          </span>
          <span className="rounded-xl border px-3 py-1.5 text-xs font-extrabold" style={{ backgroundColor: `color-mix(in srgb, ${props.planColor} 7.8%, transparent)`, borderColor: `color-mix(in srgb, ${props.planColor} 14.9%, transparent)`, color: props.planColor }}>
            {t('companies.card.plan', { plan: t(`companies.plans.${props.normalizedPlan}`, { defaultValue: props.company.subscription_plan || t('companies.plans.none') }) })}
          </span>
        </div>
      </div>
    </>
  )
}
