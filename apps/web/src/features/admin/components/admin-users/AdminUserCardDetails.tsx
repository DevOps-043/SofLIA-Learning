'use client'

import type { TFunction } from 'i18next'
import { CalendarClock, Mail } from 'lucide-react'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import type { AdminRoleConfig, AdminStatusConfig } from './types'

interface AdminUserCardDetailsProps {
  email: string
  lastAccess: string
  roleConfig: AdminRoleConfig
  statusConfig: AdminStatusConfig
  t: TFunction<'admin'>
}

export function AdminUserCardDetails({
  email,
  lastAccess,
  roleConfig,
  statusConfig,
  t,
}: AdminUserCardDetailsProps) {
  const theme = useAdminPanelTheme()
  const RoleIcon = roleConfig.icon
  const StatusIcon = statusConfig.icon
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-3 rounded-2xl px-3 py-2" style={{ backgroundColor: theme.inputBg }}>
        <span className="flex shrink-0 items-center gap-2 text-[11px] font-bold uppercase tracking-wider" style={{ color: theme.mutedTextColor }}>
          <Mail className="h-3.5 w-3.5 shrink-0" />
          {t('users.page.table.email')}
        </span>
        <span className="min-w-0 flex-1 truncate text-right text-xs font-semibold" style={{ color: email ? theme.textColor : theme.mutedTextColor }} title={email || t('users.page.noEmail')}>{email || t('users.page.noEmail')}</span>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <span className="inline-flex min-h-[34px] items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-bold" style={{ color: roleConfig.text, backgroundColor: roleConfig.bg, borderColor: roleConfig.border }}>
          <RoleIcon className="h-3.5 w-3.5" />
          {roleConfig.label}
        </span>
        <span className="inline-flex min-h-[34px] items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-bold" style={{ color: statusConfig.color, backgroundColor: statusConfig.bg, borderColor: statusConfig.border }}>
          <StatusIcon className="h-3.5 w-3.5" />
          {statusConfig.label}
        </span>
      </div>
      <div className="flex items-center gap-3 rounded-2xl px-3 py-2" style={{ backgroundColor: theme.inputBg }}>
        <span className="flex shrink-0 items-center gap-2 text-[11px] font-bold uppercase tracking-wider" style={{ color: theme.mutedTextColor }}>
          <CalendarClock className="h-3.5 w-3.5" />
          {t('users.page.table.lastAccess')}
        </span>
        <span className="min-w-0 flex-1 truncate text-right text-xs font-semibold" style={{ color: theme.textColor }} title={lastAccess}>{lastAccess}</span>
      </div>
    </div>
  )
}
