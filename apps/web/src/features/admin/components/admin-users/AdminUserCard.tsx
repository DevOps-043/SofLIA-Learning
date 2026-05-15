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
  const RoleIcon = roleConfig.icon
  const StatusIcon = statusConfig.icon
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
      <div
        className="relative h-[92px] border-b"
        style={{
          borderColor: theme.borderColor,
          background: `linear-gradient(135deg, ${theme.inputBg}, ${theme.hoverBg})`,
        }}
      >
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, ${theme.primaryColor} 1px, transparent 0)`,
            backgroundSize: '28px 28px',
          }}
        />
        <div className="absolute left-6 top-12">
          <AdminUserAvatar
            displayName={displayName}
            imageUrl={user.profile_picture_url}
            size="lg"
            accentColor={theme.primaryColor}
            borderColor={theme.cardBg}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col px-6 pb-5 pt-11">
        <div className="mb-5 min-w-0">
          <h3
            className="truncate text-base font-extrabold leading-tight"
            style={{ color: theme.textColor }}
            title={displayName}
          >
            {displayName}
          </h3>
          <div
            className="mt-1 flex min-w-0 items-center gap-1.5 text-xs font-medium"
            style={{ color: theme.subtextColor }}
          >
            <AtSign className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate" title={user.username}>
              {user.username}
            </span>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2" style={{ backgroundColor: theme.inputBg }}>
            <span
              className="flex min-w-0 items-center gap-2 text-[11px] font-bold uppercase tracking-wider"
              style={{ color: theme.mutedTextColor }}
            >
              <Mail className="h-3.5 w-3.5 shrink-0" />
              {t('users.page.table.email')}
            </span>
            <span
              className="truncate text-right text-xs font-semibold"
              style={{ color: email ? theme.textColor : theme.mutedTextColor }}
              title={email || t('users.page.noEmail')}
            >
              {email || t('users.page.noEmail')}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
          </div>

          <div className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2" style={{ backgroundColor: theme.inputBg }}>
            <span
              className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider"
              style={{ color: theme.mutedTextColor }}
            >
              <CalendarClock className="h-3.5 w-3.5" />
              {t('users.page.table.lastAccess')}
            </span>
            <span className="truncate text-right text-xs font-semibold" style={{ color: theme.textColor }}>
              {lastAccess}
            </span>
          </div>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border text-xs font-extrabold uppercase tracking-wider transition-all"
            style={{
              backgroundColor: theme.inputBg,
              borderColor: theme.borderColor,
              color: theme.textColor,
            }}
          >
            <Edit3 className="h-4 w-4" />
            {tc('actions.edit')}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border text-xs font-extrabold uppercase tracking-wider transition-all"
            style={{
              backgroundColor: `${theme.dangerColor}12`,
              borderColor: `${theme.dangerColor}30`,
              color: theme.dangerColor,
            }}
          >
            <Trash2 className="h-4 w-4" />
            {tc('actions.delete')}
          </button>
        </div>
      </div>
    </motion.article>
  )
}
