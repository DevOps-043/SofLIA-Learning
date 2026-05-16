'use client'

import { motion } from 'framer-motion'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import { AdminUserCardActions } from './AdminUserCardActions'
import { AdminUserCardDetails } from './AdminUserCardDetails'
import { AdminUserCardHeader } from './AdminUserCardHeader'
import {
  formatAdminUserDate,
  getAdminRoleConfig,
  getAdminStatusConfig,
  getAdminUserDisplayConfig,
} from './service'
import type { AdminUserCardProps } from './types'

export function AdminUserCard({ user, index, locale, onEdit, onDelete, t, tc }: AdminUserCardProps) {
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
  const lastAccess =
    formatAdminUserDate(user.last_login_at ?? user.updated_at, locale) ??
    t('users.page.lastAccessNever')

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.035, duration: 0.28, ease: 'easeOut' }}
      whileHover={{ y: -3 }}
      className="group relative flex min-h-[330px] flex-col overflow-hidden rounded-[24px] border shadow-sm transition-shadow hover:shadow-xl"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.borderColor,
        boxShadow: theme.isDark
          ? '0 18px 40px -24px rgba(0,0,0,0.75)'
          : '0 16px 36px -28px rgba(15,23,42,0.18)',
      }}
    >
      <AdminUserCardHeader
        displayName={displayName}
        username={user.username}
        imageUrl={user.profile_picture_url}
      />

      <div className="flex flex-1 flex-col px-6 pb-5 pt-11">
        <AdminUserCardDetails email={email} lastAccess={lastAccess} roleConfig={roleConfig} statusConfig={statusConfig} t={t} />
        <AdminUserCardActions onEdit={onEdit} onDelete={onDelete} tc={tc} />
      </div>
    </motion.article>
  )
}
