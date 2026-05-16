'use client'

import { motion } from 'framer-motion'
import { Edit3, Trash2 } from 'lucide-react'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import { AdminUserIconButton } from './AdminUserIconButton'
import { AdminUserListInfo } from './AdminUserListInfo'
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
      <AdminUserListInfo
        displayName={displayName}
        username={user.username}
        imageUrl={user.profile_picture_url}
        email={email}
        lastAccess={lastAccess}
        t={t}
      />

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

      <div className="flex items-center justify-end gap-2">
        <AdminUserIconButton icon={Edit3} label={tc('actions.edit')} onClick={onEdit} />
        <AdminUserIconButton icon={Trash2} label={tc('actions.delete')} onClick={onDelete} danger />
      </div>
    </motion.article>
  )
}
