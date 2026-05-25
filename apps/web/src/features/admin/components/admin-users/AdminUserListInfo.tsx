'use client'

import type { TFunction } from 'i18next'
import { AtSign, CalendarClock, Mail } from 'lucide-react'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import { AdminUserAvatar } from './AdminUserAvatar'

interface AdminUserListInfoProps {
  displayName: string
  username: string
  imageUrl: string | null | undefined
  email: string
  lastAccess: string
  t: TFunction<'admin'>
}

export function AdminUserListInfo(props: AdminUserListInfoProps) {
  const { displayName, username, imageUrl, email, lastAccess, t } = props
  const theme = useAdminPanelTheme()
  return (
    <>
      <div className="flex min-w-0 items-center gap-3">
        <AdminUserAvatar displayName={displayName} imageUrl={imageUrl ?? null} size="sm" accentColor={theme.primaryColor} borderColor={theme.borderColor} />
        <div className="min-w-0">
          <h3 className="truncate text-sm font-extrabold" style={{ color: theme.textColor }} title={displayName}>{displayName}</h3>
          <p className="mt-1 flex min-w-0 items-center gap-1.5 truncate text-xs font-semibold" style={{ color: theme.subtextColor }} title={username}>
            <AtSign className="h-3.5 w-3.5 shrink-0" />
            {username}
          </p>
        </div>
      </div>
      <div className="min-w-0 rounded-2xl px-3 py-2 lg:bg-transparent lg:px-0 lg:py-0" style={{ backgroundColor: theme.inputBg }}>
        <p className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider lg:hidden" style={{ color: theme.mutedTextColor }}>
          <Mail className="h-3.5 w-3.5" />
          {t('users.page.table.email')}
        </p>
        <p className="truncate text-sm font-semibold" style={{ color: email ? theme.textColor : theme.mutedTextColor }} title={email || t('users.page.noEmail')}>{email || t('users.page.noEmail')}</p>
      </div>
      <div className="rounded-2xl px-3 py-2 lg:bg-transparent lg:px-0 lg:py-0" style={{ backgroundColor: theme.inputBg }}>
        <p className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider lg:hidden" style={{ color: theme.mutedTextColor }}>
          <CalendarClock className="h-3.5 w-3.5" />
          {t('users.page.table.lastAccess')}
        </p>
        <p className="truncate text-sm font-semibold" style={{ color: theme.textColor }}>{lastAccess}</p>
      </div>
    </>
  )
}
