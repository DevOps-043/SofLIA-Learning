'use client'

import Image from 'next/image'
import type { LucideIcon } from 'lucide-react'
import { Building2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import type { AdminCompany } from '../../types/admin-companies.types'
import type { AdminCompaniesThemeColors } from '../../services/admin-companies'

interface AdminCompanyCardHeaderProps {
  company: AdminCompany
  logoUrl: string | null
  status: {
    icon: LucideIcon
    bg: string
    border: string
    color: string
    key: string
  }
  themeColors: AdminCompaniesThemeColors
}

export function AdminCompanyCardHeader(props: AdminCompanyCardHeaderProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()
  const StatusIcon = props.status.icon
  return (
    <div className="relative border-b px-6 py-5" style={{ borderColor: props.themeColors.borderColor, background: `linear-gradient(135deg, ${theme.inputBg}, ${theme.hoverBg})` }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border shadow-sm" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor, color: theme.primaryColor }}>
            {props.logoUrl ? <Image src={props.logoUrl} alt={props.company.name} fill sizes="64px" className="object-contain p-2" unoptimized /> : <Building2 className="h-8 w-8" />}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-extrabold" style={{ color: props.themeColors.textPrimary }} title={props.company.name}>{props.company.name}</h3>
            <p className="mt-1 truncate text-sm font-semibold" style={{ color: props.themeColors.textSecondary }}>{props.company.slug || t('companies.card.noSlug')}</p>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-extrabold" style={{ backgroundColor: props.status.bg, borderColor: props.status.border, color: props.status.color }}>
          <StatusIcon className="h-3.5 w-3.5" />
          {t(`companies.status.${props.status.key}`)}
        </span>
      </div>
    </div>
  )
}
