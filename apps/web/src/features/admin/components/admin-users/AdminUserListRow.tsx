'use client'

import { motion } from 'framer-motion'
import { AtSign, CalendarClock, Edit3, Mail, Trash2 } from 'lucide-react'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import { AdminUserAvatar } from './AdminUserAvatar'
import {
  formatAdminUserDate,
  getAdminRoleConfig,
  getAdminStatusConfig,
  getAdminUserDisplayConfig,
} from './service'
import type { AdminUserListRowProps } from './types'

export function AdminUserListRow({
  user,
  index,
  locale,
  onEdit,
  onDelete,
  t,
  tc,
}: AdminUserListRowProps) {
  const theme = useAdminPanelTheme()
  const { displayName, email, role } = getAdminUserDisplayConfig(user)
  const roleConfig = getAdminRoleConfig(role, theme, {
    Usuario: t('users.roles.Usuario'),
    Instructor: t('users.roles.Instructor'),
    Administrador: t('users.roles.Administrador'),
    Business: t('users.roles.Business'),
  })
  const statusConfig = getAdminStatusConfig(user.email_verified, theme, {
    verified: t('users.page.status.verified'),
    pending: t('users.page.status.pending'),
  })
  const RoleIcon = roleConfig.icon
  const StatusIcon = statusConfig.icon
  const lastAccess =
    formatAdminUserDate(user.last_login_at ?? user.updated_at, locale) ??
    t('users.page.lastAccessNever')

  return (
    <motion.article
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.025, duration: 0.25, ease: 'easeOut' }}
      className="grid gap-4 rounded-[20px] border p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md lg:grid-cols-[minmax(260px,1.5fr)_minmax(220px,1.05fr)_minmax(150px,0.75fr)_minmax(150px,0.75fr)_minmax(150px,0.7fr)_auto] lg:items-center"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.borderColor,
      }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <AdminUserAvatar
          displayName={displayName}
          imageUrl={user.profile_picture_url}
          size="sm"
          accentColor={theme.primaryColor}
          borderColor={theme.borderColor}
        />
        <div className="min-w-0">
          <h3 className="truncate text-sm font-extrabold" style={{ color: theme.textColor }} title={displayName}>
            {displayName}
          </h3>
          <p
            className="mt-1 flex min-w-0 items-center gap-1.5 truncate text-xs font-semibold"
            style={{ color: theme.subtextColor }}
            title={user.username}
          >
            <AtSign className="h-3.5 w-3.5 shrink-0" />
            {user.username}
          </p>
        </div>
      </div>

      <div className="min-w-0 rounded-2xl px-3 py-2 lg:bg-transparent lg:px-0 lg:py-0" style={{ backgroundColor: theme.inputBg }}>
        <p className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider lg:hidden" style={{ color: theme.mutedTextColor }}>
          <Mail className="h-3.5 w-3.5" />
          {t('users.page.table.email')}
        </p>
        <p
          className="truncate text-sm font-semibold"
          style={{ color: email ? theme.textColor : theme.mutedTextColor }}
          title={email || t('users.page.noEmail')}
        >
          {email || t('users.page.noEmail')}
        </p>
      </div>

      <span
        className="inline-flex min-h-[34px] items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-bold"
        style={{
          color: roleConfig.text,
          backgroundColor: roleConfig.bg,
          borderColor: roleConfig.border,
        }}
      >
        <RoleIcon className="h-3.5 w-3.5" />
        {roleConfig.label}
      </span>

      <span
        className="inline-flex min-h-[34px] items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-bold"
        style={{
          color: statusConfig.color,
          backgroundColor: statusConfig.bg,
          borderColor: statusConfig.border,
        }}
      >
        <StatusIcon className="h-3.5 w-3.5" />
        {statusConfig.label}
      </span>

      <div className="rounded-2xl px-3 py-2 lg:bg-transparent lg:px-0 lg:py-0" style={{ backgroundColor: theme.inputBg }}>
        <p className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider lg:hidden" style={{ color: theme.mutedTextColor }}>
          <CalendarClock className="h-3.5 w-3.5" />
          {t('users.page.table.lastAccess')}
        </p>
        <p className="truncate text-sm font-semibold" style={{ color: theme.textColor }}>
          {lastAccess}
        </p>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors"
          style={{
            backgroundColor: theme.inputBg,
            borderColor: theme.borderColor,
            color: theme.textColor,
          }}
          aria-label={tc('actions.edit')}
          title={tc('actions.edit')}
        >
          <Edit3 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors"
          style={{
            backgroundColor: `${theme.dangerColor}12`,
            borderColor: `${theme.dangerColor}30`,
            color: theme.dangerColor,
          }}
          aria-label={tc('actions.delete')}
          title={tc('actions.delete')}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </motion.article>
  )
}
