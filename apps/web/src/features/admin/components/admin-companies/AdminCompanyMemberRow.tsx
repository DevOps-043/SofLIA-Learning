'use client'

import Image from 'next/image'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import type { AdminCompanyMember } from '../../types/admin-companies.types'
import type { AdminCompaniesThemeColors } from '../../services/admin-companies'
import { getMemberDisplayName } from './admin-company-view-modal.helpers'

interface AdminCompanyMemberRowProps {
  member: AdminCompanyMember
  roleLabel: string
  fallback: string
  themeColors: AdminCompaniesThemeColors
}

export function AdminCompanyMemberRow(props: AdminCompanyMemberRowProps) {
  const theme = useAdminPanelTheme()
  const displayName = getMemberDisplayName(props.member, props.fallback)
  return (
    <div className="flex items-center gap-3 rounded-2xl px-3 py-2" style={{ backgroundColor: theme.cardBg }}>
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl font-extrabold" style={{ backgroundColor: `color-mix(in srgb, ${theme.primaryColor} 7.8%, transparent)`, color: theme.primaryColor }}>
        {props.member.user?.profile_picture_url ? <Image src={props.member.user.profile_picture_url} alt={displayName} fill sizes="40px" className="object-cover" unoptimized /> : displayName.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold" style={{ color: props.themeColors.textPrimary }}>{displayName}</p>
        <p className="truncate text-xs font-medium" style={{ color: props.themeColors.textSecondary }}>{props.member.user?.email}</p>
      </div>
      <span className="rounded-xl px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider" style={{ backgroundColor: `color-mix(in srgb, ${theme.primaryColor} 7.8%, transparent)`, color: theme.primaryColor }}>{props.roleLabel}</span>
    </div>
  )
}
