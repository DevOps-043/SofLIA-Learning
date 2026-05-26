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
      className="rounded-[20px] border p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md lg:grid lg:grid-cols-[minmax(200px,1.5fr)_minmax(160px,1fr)_130px_auto_auto_auto] lg:items-center lg:gap-4"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.borderColor,
      }}
    >
      {/* Desktop: Fragment renders 3 direct grid cells (name, email, date).
          Mobile: each child stacks as a full-width block row. */}
      <AdminUserListInfo
        displayName={displayName}
        username={user.username}
        imageUrl={user.profile_picture_url}
        email={email}
        lastAccess={lastAccess}
        t={t}
      />

      {/* Desktop (lg:contents): role, status, and buttons become direct grid cells.
          Mobile: flex row — badges on left, buttons on right. */}
      <div className="mt-3 flex items-center gap-2 lg:mt-0 lg:contents">
        <span
          className="inline-flex min-h-[32px] items-center gap-1.5 whitespace-nowrap rounded-xl border px-3 text-xs font-bold"
          style={{
            color: roleConfig.text,
            backgroundColor: roleConfig.bg,
            borderColor: roleConfig.border,
          }}
        >
          <RoleIcon className="h-3.5 w-3.5 shrink-0" />
          {roleConfig.label}
        </span>

        <span
          className="inline-flex min-h-[32px] items-center gap-1.5 whitespace-nowrap rounded-xl border px-3 text-xs font-bold"
          style={{
            color: statusConfig.color,
            backgroundColor: statusConfig.bg,
            borderColor: statusConfig.border,
          }}
        >
          <StatusIcon className="h-3.5 w-3.5 shrink-0" />
          {statusConfig.label}
        </span>

        <div className="ml-auto flex items-center gap-2 lg:ml-0 lg:justify-end">
          <AdminUserIconButton icon={Edit3} label={tc('actions.edit')} onClick={onEdit} />
          <AdminUserIconButton icon={Trash2} label={tc('actions.delete')} onClick={onDelete} danger />
        </div>
      </div>
    </motion.article>
  )
}
